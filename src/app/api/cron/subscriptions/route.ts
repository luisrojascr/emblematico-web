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
 *   1. Lapsed trials and paid plans drop to Free (run_subscription_expiry); their
 *      owners get an email and their cached public guides are refreshed (branding
 *      and paused redirects depend on the plan).
 *   2. Reminders: 7 and 3 days before a trial ends, 7 days before a paid plan ends,
 *      and when it ends (7-day grace). Each one is recorded and sent only once.
 */
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

type Admin = ReturnType<typeof createAdminClient>;

async function profilesById(supabase: Admin, ids: string[]) {
  if (ids.length === 0)
    return new Map<
      string,
      { email: string | null; full_name: string | null; role: string }
    >();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p]));
}

async function notify(
  supabase: Admin,
  input: {
    userId: string;
    email: string | null;
    name: string | null;
    kind: NoticeKind;
    plan: Parameters<typeof noticeEmail>[1]["plan"];
    periodEnd: Date;
    daysLeft: number;
  },
): Promise<"sent" | "skipped" | "failed"> {
  if (!input.email) return "skipped";
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

async function run() {
  const supabase = createAdminClient();
  const now = new Date();
  const summary = {
    expired: 0,
    guidesRefreshed: 0,
    emails: { sent: 0, skipped: 0, failed: 0 },
    emailConfigured: emailConfigured(),
  };
  const count = (result: "sent" | "skipped" | "failed") => {
    summary.emails[result] += 1;
  };

  // 1. Expiry -----------------------------------------------------------------------
  const { data: expired, error: expiryError } = await supabase.rpc(
    "run_subscription_expiry",
  );
  if (expiryError) {
    console.error(
      "subscription expiry failed",
      expiryError.code,
      expiryError.message,
    );
    throw new Error("expiry failed");
  }
  const lapsed = expired ?? [];
  summary.expired = lapsed.length;

  if (lapsed.length > 0) {
    const ids = lapsed.map((row) => row.user_id);
    const [profiles, { data: owned }] = await Promise.all([
      profilesById(supabase, ids),
      supabase
        .from("business_members")
        .select("business_id")
        .in("user_id", ids)
        .eq("role", "owner"),
    ]);
    await Promise.all(
      (owned ?? []).map((row) => revalidateBusiness(supabase, row.business_id)),
    );
    summary.guidesRefreshed = owned?.length ?? 0;

    if (summary.emailConfigured) {
      for (const row of lapsed) {
        const profile = profiles.get(row.user_id);
        count(
          await notify(supabase, {
            userId: row.user_id,
            email: profile?.email ?? null,
            name: profile?.full_name ?? null,
            kind: droppedNotice(row.previous_status),
            plan: row.previous_plan,
            periodEnd: new Date(row.period_end ?? now),
            daysLeft: 0,
          }),
        );
      }
    }
  }

  // 2. Reminders ----------------------------------------------------------------------
  if (summary.emailConfigured) {
    const soon = new Date(
      now.getTime() + 8 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const graceStart = new Date(
      now.getTime() - 8 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data: candidates, error } = await supabase
      .from("subscriptions")
      .select("user_id, plan, status, trial_ends_at, current_period_end")
      .neq("plan", "free")
      .or(
        `and(status.eq.trialing,trial_ends_at.lte."${soon}"),and(status.in.(active,canceled),current_period_end.gte."${graceStart}",current_period_end.lte."${soon}")`,
      );
    if (error) {
      console.error("reminder query failed", error.code, error.message);
    } else {
      const due = (candidates ?? [])
        .map((sub) => ({ sub, notice: dueNotice(sub, now) }))
        .filter(
          (
            item,
          ): item is {
            sub: (typeof item)["sub"];
            notice: NonNullable<(typeof item)["notice"]>;
          } => item.notice !== null,
        );
      const profiles = await profilesById(
        supabase,
        due.map((item) => item.sub.user_id),
      );
      for (const { sub, notice } of due) {
        const profile = profiles.get(sub.user_id);
        if (!profile || profile.role === "admin") continue;
        count(
          await notify(supabase, {
            userId: sub.user_id,
            email: profile.email,
            name: profile.full_name,
            kind: notice.kind,
            plan: sub.plan,
            periodEnd: notice.periodEnd,
            daysLeft: notice.daysLeft,
          }),
        );
      }
    }
  } else {
    console.warn(
      "RESEND_API_KEY is not set: subscription emails were not sent",
    );
  }

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
