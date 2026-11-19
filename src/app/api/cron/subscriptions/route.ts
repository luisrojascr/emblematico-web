import { timingSafeEqual } from "node:crypto";

import { revalidateBusiness } from "@/lib/admin/cache";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { SITE } from "@/lib/site";
import {
  droppedNotice,
  dueNotice,
  noticeEmail,
  type NoticeKind,
} from "@/lib/subscriptions/notices";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Daily subscription job, called by pg_cron in Supabase (migration 14) with
 * `Authorization: Bearer <CRON_SECRET>`. GET also works, which is what Vercel Cron
 * sends, so moving the schedule to Vercel later needs no code change.
 *
 *   1. Lapsed trials and paid plans drop to Free (expire_subscriptions). The same
 *      statement queues each dropped account in subscription_expirations (migration 15).
 *   2. The queue is worked through in batches: cached public guides are refreshed
 *      (branding and paused redirects depend on the plan) and the owner is emailed.
 *      Rows are marked processed one batch at a time, so whatever a run leaves behind
 *      (time budget, a failed email, a crash) the next run picks up.
 *   3. Reminders: 7 and 3 days before a trial ends, 7 days before a paid plan ends,
 *      and when it ends (7-day grace). Each one is recorded and sent only once.
 *
 * Every query reads at most BATCH_SIZE rows, well under the API's max_rows (1000).
 */
export const maxDuration = 60;

/** No new work starts after this, leaving room before maxDuration. */
const TIME_BUDGET_MS = 40_000;
/** Queue rows and reminder candidates read per query. */
const BATCH_SIZE = 100;
/** Ids per `.in()` filter, to keep request URLs short. */
const ID_CHUNK = 100;
/** Guides refreshed in parallel. */
const REVALIDATE_CONCURRENCY = 10;
/** Minimum gap between emails, to stay under Resend's rate limit. */
const SEND_INTERVAL_MS = 600;
/** A dropped account whose email keeps failing is given up after this many runs. */
const MAX_ATTEMPTS = 3;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

type Admin = ReturnType<typeof createAdminClient>;
type Profile = { email: string | null; full_name: string | null; role: string };
type SendResult = "sent" | "skipped" | "failed";

type Context = {
  supabase: Admin;
  now: Date;
  hasTime: () => boolean;
  pace: () => Promise<void>;
  summary: {
    expired: number;
    processed: number;
    pending: number;
    guidesRefreshed: number;
    emails: Record<SendResult, number>;
    emailConfigured: boolean;
  };
};

function chunk<T>(items: readonly T[], size: number): T[][] {
  const parts: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    parts.push(items.slice(i, i + size));
  }
  return parts;
}

/** Waits so that consecutive calls are at least `intervalMs` apart. */
function pacer(intervalMs: number): () => Promise<void> {
  let next = 0;
  return async () => {
    const wait = next - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    next = Date.now() + intervalMs;
  };
}

/** Throws on a failed query, so a batch is left pending instead of half done. */
async function profilesById(
  supabase: Admin,
  ids: readonly string[],
): Promise<Map<string, Profile>> {
  const profiles = new Map<string, Profile>();
  for (const part of chunk([...new Set(ids)], ID_CHUNK)) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .in("id", part);
    if (error) throw new Error(`profiles: ${error.code} ${error.message}`);
    for (const profile of data ?? []) profiles.set(profile.id, profile);
  }
  return profiles;
}

async function ownedBusinessIds(
  supabase: Admin,
  userIds: readonly string[],
): Promise<string[]> {
  const ids = new Set<string>();
  for (const part of chunk([...new Set(userIds)], ID_CHUNK)) {
    const { data, error } = await supabase
      .from("business_members")
      .select("business_id")
      .in("user_id", part)
      .eq("role", "owner");
    if (error) throw new Error(`businesses: ${error.code} ${error.message}`);
    for (const row of data ?? []) ids.add(row.business_id);
  }
  return [...ids];
}

async function notify(
  ctx: Context,
  input: {
    userId: string;
    email: string | null;
    name: string | null;
    kind: NoticeKind;
    plan: Parameters<typeof noticeEmail>[1]["plan"];
    periodEnd: Date;
    daysLeft: number;
  },
): Promise<SendResult> {
  if (!input.email) return "skipped";
  const { supabase } = ctx;
  // Claim the notice first: a second run (or a retry) cannot send it again.
  const { error: claimError } = await supabase
    .from("subscription_notices")
    .insert({
      user_id: input.userId,
      kind: input.kind,
      period_end: input.periodEnd.toISOString(),
    });
  if (claimError) {
    if (claimError.code === "23505") return "skipped";
    console.error("notice claim failed", claimError.code, claimError.message);
    return "failed";
  }
  const email = noticeEmail(input.kind, {
    name: input.name,
    plan: input.plan,
    periodEnd: input.periodEnd,
    daysLeft: input.daysLeft,
    siteUrl: SITE.url,
  });
  await ctx.pace();
  const sent = await sendEmail({ to: input.email, ...email });
  if (!sent) {
    // Release the claim so the next run tries again.
    await supabase
      .from("subscription_notices")
      .delete()
      .eq("user_id", input.userId)
      .eq("kind", input.kind)
      .eq("period_end", input.periodEnd.toISOString());
    return "failed";
  }
  return "sent";
}

/** Step 2: refresh guides and email the accounts queued by the expiry. */
async function processExpirations(ctx: Context) {
  const { supabase, summary } = ctx;
  let afterId = 0;

  while (ctx.hasTime()) {
    const { data: batch, error } = await supabase
      .from("subscription_expirations")
      .select(
        "id, user_id, previous_plan, previous_status, period_end, expired_at, attempts",
      )
      .is("processed_at", null)
      .gt("id", afterId)
      .order("id")
      .limit(BATCH_SIZE);
    if (error) {
      console.error("expiry queue read failed", error.code, error.message);
      return;
    }
    if (!batch || batch.length === 0) return;
    afterId = batch[batch.length - 1].id;

    let profiles: Map<string, Profile>;
    let businessIds: string[];
    try {
      const userIds = batch.map((row) => row.user_id);
      [profiles, businessIds] = await Promise.all([
        profilesById(supabase, userIds),
        ownedBusinessIds(supabase, userIds),
      ]);
    } catch (lookupError) {
      console.error(
        "expiry batch lookup failed",
        lookupError instanceof Error ? lookupError.message : lookupError,
      );
      return;
    }

    // Safe to repeat: rows left pending get their guides refreshed again next run.
    for (const part of chunk(businessIds, REVALIDATE_CONCURRENCY)) {
      await Promise.all(part.map((id) => revalidateBusiness(supabase, id)));
    }
    summary.guidesRefreshed += businessIds.length;

    const done: number[] = [];
    for (const row of batch) {
      if (!ctx.hasTime()) break;
      const profile = profiles.get(row.user_id);
      // Without an email key the drop still counts as handled: a "your plan ended"
      // email sent days later, once the key is set, would only confuse.
      const result: SendResult = summary.emailConfigured
        ? await notify(ctx, {
            userId: row.user_id,
            email: profile?.email ?? null,
            name: profile?.full_name ?? null,
            kind: droppedNotice(row.previous_status),
            plan: row.previous_plan,
            // Stable across retries, so the notice claim matches on every run.
            periodEnd: new Date(row.period_end ?? row.expired_at),
            daysLeft: 0,
          })
        : "skipped";
      summary.emails[result] += 1;

      if (result === "failed" && row.attempts + 1 < MAX_ATTEMPTS) {
        await supabase
          .from("subscription_expirations")
          .update({ attempts: row.attempts + 1 })
          .eq("id", row.id);
      } else {
        done.push(row.id);
      }
    }

    if (done.length > 0) {
      const { error: doneError } = await supabase
        .from("subscription_expirations")
        .update({ processed_at: new Date().toISOString() })
        .in("id", done);
      if (doneError) {
        // Emails already sent are claimed, so a retry will not send them twice.
        console.error(
          "expiry queue update failed",
          doneError.code,
          doneError.message,
        );
        return;
      }
      summary.processed += done.length;
    }
    if (batch.length < BATCH_SIZE) return;
  }
}

/** Step 3: reminder emails before (and right after) a plan ends. */
async function sendReminders(ctx: Context) {
  const { supabase, now } = ctx;
  const soon = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString();
  const graceStart = new Date(
    now.getTime() - 8 * 24 * 60 * 60 * 1000,
  ).toISOString();
  let afterUserId: string | null = null;

  while (ctx.hasTime()) {
    let query = supabase
      .from("subscriptions")
      .select("user_id, plan, status, trial_ends_at, current_period_end")
      .neq("plan", "free")
      .or(
        `and(status.eq.trialing,trial_ends_at.lte."${soon}"),and(status.in.(active,canceled),current_period_end.gte."${graceStart}",current_period_end.lte."${soon}")`,
      )
      .order("user_id")
      .limit(BATCH_SIZE);
    if (afterUserId) query = query.gt("user_id", afterUserId);
    const { data: page, error } = await query;
    if (error) {
      console.error("reminder query failed", error.code, error.message);
      return;
    }
    if (!page || page.length === 0) return;
    afterUserId = page[page.length - 1].user_id;

    const due = page
      .map((sub) => ({ sub, notice: dueNotice(sub, now) }))
      .filter(
        (
          item,
        ): item is {
          sub: (typeof item)["sub"];
          notice: NonNullable<(typeof item)["notice"]>;
        } => item.notice !== null,
      );

    if (due.length > 0) {
      let profiles: Map<string, Profile>;
      try {
        profiles = await profilesById(
          supabase,
          due.map((item) => item.sub.user_id),
        );
      } catch (lookupError) {
        console.error(
          "reminder lookup failed",
          lookupError instanceof Error ? lookupError.message : lookupError,
        );
        return;
      }
      for (const { sub, notice } of due) {
        // Reminders not sent today are still due tomorrow (the windows span days).
        if (!ctx.hasTime()) return;
        const profile = profiles.get(sub.user_id);
        if (!profile || profile.role === "admin") continue;
        ctx.summary.emails[
          await notify(ctx, {
            userId: sub.user_id,
            email: profile.email,
            name: profile.full_name,
            kind: notice.kind,
            plan: sub.plan,
            periodEnd: notice.periodEnd,
            daysLeft: notice.daysLeft,
          })
        ] += 1;
      }
    }
    if (page.length < BATCH_SIZE) return;
  }
}

async function run() {
  const supabase = createAdminClient();
  const startedAt = Date.now();
  const ctx: Context = {
    supabase,
    now: new Date(),
    hasTime: () => Date.now() - startedAt < TIME_BUDGET_MS,
    pace: pacer(SEND_INTERVAL_MS),
    summary: {
      expired: 0,
      processed: 0,
      pending: 0,
      guidesRefreshed: 0,
      emails: { sent: 0, skipped: 0, failed: 0 },
      emailConfigured: emailConfigured(),
    },
  };
  const { summary } = ctx;

  // 1. Expiry: drops lapsed plans and queues them, in one statement.
  const { data: expired, error: expiryError } = await supabase.rpc(
    "expire_subscriptions",
  );
  if (expiryError) {
    console.error(
      "subscription expiry failed",
      expiryError.code,
      expiryError.message,
    );
    throw new Error("expiry failed");
  }
  summary.expired = expired ?? 0;

  // 2. Guides and emails for the queued drops (this run's and any left over).
  await processExpirations(ctx);

  // 3. Reminders.
  if (summary.emailConfigured) {
    await sendReminders(ctx);
  } else {
    console.warn(
      "RESEND_API_KEY is not set: subscription emails were not sent",
    );
  }

  const { count } = await supabase
    .from("subscription_expirations")
    .select("id", { count: "exact", head: true })
    .is("processed_at", null);
  summary.pending = count ?? 0;

  return summary;
}

async function handle(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    return Response.json(await run());
  } catch {
    return Response.json({ error: "job failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
