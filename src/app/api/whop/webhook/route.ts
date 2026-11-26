import { randomUUID } from "node:crypto";

import { after } from "next/server";

import { revalidateBusiness } from "@/lib/admin/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchMembership,
  MEMBERSHIP_ID_RE,
  WhopApiError,
} from "@/lib/whop/api";
import { scheduledCancellation } from "@/lib/whop/billing";
import { whopConfig } from "@/lib/whop/config";
import {
  bestGrantingPatch,
  decide,
  grantsAccess,
  metadataUserId,
  type SubscriptionPatch,
  type WhopMembership,
} from "@/lib/whop/membership";
import { sendCancellationNotice } from "@/lib/whop/notify";
import { verifyWhopSignature } from "@/lib/whop/signature";

/**
 * Whop webhook receiver (Developer > Webhooks in the Whop dashboard).
 *
 *   1. Verifies the signature over the raw body (WHOP_WEBHOOK_SECRET).
 *   2. Stores every event in billing_events. The unique (provider, provider_event_id)
 *      key makes redeliveries no-ops; an event whose processing failed is retried.
 *   3. membership.* events re-read the membership from the Whop API (WHOP_API_KEY) and
 *      update the user's row in `subscriptions` from that current state, so late or
 *      out-of-order deliveries cannot apply an old snapshot. Each user is handled by
 *      one delivery at a time (billing_locks lease, migration 18); a delivery that
 *      finds the lease taken answers 5xx and Whop redelivers it. Payment events
 *      are only recorded: Whop reflects their effect (activation, past_due) in a
 *      membership event too.
 *
 * Users are linked through checkout metadata (`supabase_user_id`), or, for later
 * events, through the Whop membership/customer ids saved on the first one.
 * Whop expects a 2xx within 5 seconds; a 5xx makes it retry with backoff.
 */
const PROVIDER = "whop";

/** Other memberships of the user re-read when the current one stops granting access. */
const MAX_ALTERNATIVES = 5;

const WHOP_USER_RE = /^user_[A-Za-z0-9]+$/;

/** Per-user lease; longer than maxDuration so it never ends while we still run. */
const LOCK_SECONDS = 30;

export const maxDuration = 15;

type Admin = ReturnType<typeof createAdminClient>;
type WhopEvent = { id?: string; type?: string; data?: unknown };

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status });

export async function POST(request: Request) {
  const config = whopConfig();
  if (!config.webhookSecret || !config.apiKey || !config.apiBase) {
    return json({ error: "not_configured" }, 503);
  }

  const body = await request.text();
  const check = verifyWhopSignature(
    config.webhookSecret,
    {
      id: request.headers.get("webhook-id"),
      timestamp: request.headers.get("webhook-timestamp"),
      signature: request.headers.get("webhook-signature"),
    },
    body,
  );
  if (!check.ok) {
    return json({ error: check.reason }, 401);
  }

  let event: WhopEvent;
  try {
    event = JSON.parse(body) as WhopEvent;
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  const eventId = request.headers.get("webhook-id") ?? event.id ?? "";
  const eventType = typeof event.type === "string" ? event.type : "unknown";

  const supabase = createAdminClient();
  const stored = await storeEvent(supabase, eventId, eventType, event);
  if (stored === "error") return json({ error: "store_failed" }, 500);
  if (stored === "done") return json({ ok: true, duplicate: true });

  try {
    const note = eventType.startsWith("membership.")
      ? await handleMembership(supabase, config, event.data as WhopMembership)
      : "recorded";
    // Terminal outcomes (error:...) are acknowledged with 200 on purpose: Whop
    // disables an endpoint after repeated failures, so only transient problems
    // (database, Whop API outage, busy lease) may answer 5xx and be retried.
    await markEvent(supabase, eventId, note.startsWith("error:") ? note : null);
    return json({ ok: true, result: note });
  } catch (error) {
    if (error instanceof WhopApiError && error.status === 404) {
      await markEvent(supabase, eventId, "error:membership_not_found");
      return json({ ok: true, result: "error:membership_not_found" });
    }
    const message = (error as Error).message?.slice(0, 500) ?? "unknown";
    console.error("whop webhook failed", eventType, message);
    await markEvent(supabase, eventId, `error:${message}`, false);
    return json({ error: "processing_failed" }, 500);
  }
}

/**
 * Inserts the event. Returns "new" when it must be processed, "done" when an earlier
 * delivery already processed it, "error" when the database is unreachable.
 */
async function storeEvent(
  supabase: Admin,
  eventId: string,
  eventType: string,
  payload: WhopEvent,
): Promise<"new" | "done" | "error"> {
  const { error } = await supabase.from("billing_events").insert({
    provider: PROVIDER,
    provider_event_id: eventId,
    event_type: eventType,
    payload: payload as never,
  });
  if (!error) return "new";
  if (error.code !== "23505") {
    console.error("billing_events insert failed", error.code, error.message);
    return "error";
  }
  const { data } = await supabase
    .from("billing_events")
    .select("processed_at")
    .eq("provider", PROVIDER)
    .eq("provider_event_id", eventId)
    .maybeSingle();
  return data?.processed_at ? "done" : "new";
}

async function markEvent(
  supabase: Admin,
  eventId: string,
  error: string | null,
  processed = true,
) {
  await supabase
    .from("billing_events")
    .update({
      processed_at: processed ? new Date().toISOString() : null,
      error,
    })
    .eq("provider", PROVIDER)
    .eq("provider_event_id", eventId);
}

async function handleMembership(
  supabase: Admin,
  config: ReturnType<typeof whopConfig>,
  payload: WhopMembership | undefined,
): Promise<string> {
  if (!payload?.id) return "error:no_membership";
  if (!MEMBERSHIP_ID_RE.test(payload.id)) return "error:bad_membership_id";

  let userId = await resolveUser(supabase, payload);
  if (!userId) {
    // The payload may predate metadata edits; the live membership is the last word.
    userId = await resolveUser(
      supabase,
      await fetchMembership(config, payload.id),
    );
  }
  if (!userId) return "error:unmatched_user";

  // One delivery per user at a time (migration 18): the fresh read, the decision and
  // the write below must not interleave with another event for the same account.
  const token = randomUUID();
  const { data: locked, error: lockError } = await supabase.rpc(
    "acquire_billing_lock",
    { p_user_id: userId, p_token: token, p_seconds: LOCK_SECONDS },
  );
  // 23503: the metadata names an account that does not exist (or was deleted).
  if (lockError?.code === "23503") return "error:unknown_user";
  if (lockError) throw new Error(`lock: ${lockError.message}`);
  if (!locked) throw new Error("busy: another event for this user is running");

  try {
    // Always the current state from the API; a failed read throws and Whop retries.
    const membership = await fetchMembership(config, payload.id);
    const liveOwner = metadataUserId(membership);
    if (liveOwner && liveOwner !== userId) return "error:user_mismatch";

    const { data: current, error: readError } = await supabase
      .from("subscriptions")
      .select(
        "plan, status, provider, provider_subscription_id, current_period_end",
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (readError) throw new Error(`read subscription: ${readError.message}`);

    const decision = decide(membership, current, config.products);
    let patch: SubscriptionPatch | null =
      decision.action === "apply" ? decision.patch : null;

    // The outcome leaves the user without access: another membership of theirs
    // (skipped earlier because this one was better) may still be paid for.
    const leavesWithoutAccess =
      (patch &&
        !grantsAccess(patch.status, patch.current_period_end, new Date())) ||
      (decision.action === "skip" &&
        decision.reason === "no_membership_grants_access");
    if (leavesWithoutAccess) {
      const others = await otherMemberships(
        supabase,
        config,
        userId,
        membership,
        current?.provider_subscription_id ?? null,
      );
      patch = bestGrantingPatch(others, config.products) ?? patch;
    }
    if (!patch) {
      return `skipped:${decision.action === "skip" ? decision.reason : "none"}`;
    }

    const { error } = await supabase
      .from("subscriptions")
      .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
    if (error) throw new Error(`upsert subscription: ${error.message}`);

    await revalidateOwnedGuides(supabase, userId);

    // Our own Spanish email for a cancellation the buyer scheduled. Sent after the
    // response so Whop gets its answer within the 5 seconds it allows.
    const canceled =
      patch.provider_subscription_id === membership.id
        ? scheduledCancellation(membership, patch)
        : null;
    if (canceled) {
      const notifiedUser = userId;
      after(() =>
        sendCancellationNotice(supabase, { userId: notifiedUser, ...canceled }),
      );
    }
    return `applied:${patch.plan}:${patch.status}:${patch.provider_subscription_id}`;
  } finally {
    const { error } = await supabase.rpc("release_billing_lock", {
      p_user_id: userId,
      p_token: token,
    });
    // Not fatal: the lease expires on its own after LOCK_SECONDS.
    if (error) console.error("release billing lock failed", error.message);
  }
}

/**
 * Checkout metadata first, then the Whop ids saved by an earlier event. Query errors
 * are thrown (the event stays unprocessed and Whop retries it); null means the
 * lookups succeeded and no account matches.
 */
async function resolveUser(
  supabase: Admin,
  membership: WhopMembership,
): Promise<string | null> {
  const fromMetadata = metadataUserId(membership);
  if (fromMetadata) return fromMetadata;

  const byMembership = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("provider", PROVIDER)
    .eq("provider_subscription_id", membership.id)
    .maybeSingle();
  if (byMembership.error) {
    throw new Error(`lookup by membership: ${byMembership.error.message}`);
  }
  if (byMembership.data) return byMembership.data.user_id;

  if (!membership.user_id) return null;
  const byCustomer = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("provider", PROVIDER)
    .eq("provider_customer_id", membership.user_id)
    .limit(1)
    .maybeSingle();
  if (byCustomer.error) {
    throw new Error(`lookup by customer: ${byCustomer.error.message}`);
  }
  return byCustomer.data?.user_id ?? null;
}

/**
 * The user's other Whop memberships we have heard of (earlier webhook payloads with
 * their metadata or their Whop user id, plus the one the row points at), re-read
 * from the API. A failed read throws so the event is retried.
 */
async function otherMemberships(
  supabase: Admin,
  config: ReturnType<typeof whopConfig>,
  userId: string,
  membership: WhopMembership,
  rowMembershipId: string | null,
): Promise<WhopMembership[]> {
  const filters = [`payload->data->metadata->>supabase_user_id.eq.${userId}`];
  if (membership.user_id && WHOP_USER_RE.test(membership.user_id)) {
    filters.push(`payload->data->>user_id.eq.${membership.user_id}`);
  }
  const { data, error } = await supabase
    .from("billing_events")
    .select("membership_id:payload->data->>id")
    .eq("provider", PROVIDER)
    .like("event_type", "membership.%")
    .or(filters.join(","))
    .order("received_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`list memberships: ${error.message}`);

  const ids = new Set<string>();
  if (rowMembershipId) ids.add(rowMembershipId);
  for (const row of (data ?? []) as { membership_id: unknown }[]) {
    if (typeof row.membership_id === "string") ids.add(row.membership_id);
  }
  ids.delete(membership.id);

  const candidates = [...ids]
    .filter((id) => MEMBERSHIP_ID_RE.test(id))
    .slice(0, MAX_ALTERNATIVES);
  const fetched = await Promise.all(
    candidates.map((id) =>
      fetchMembership(config, id).catch((error: unknown) => {
        // A membership Whop no longer has is simply not a candidate.
        if (error instanceof WhopApiError && error.status === 404) return null;
        throw error;
      }),
    ),
  );
  // Only memberships that belong to this account.
  return fetched.filter((m): m is WhopMembership => {
    if (!m) return false;
    const owner = metadataUserId(m);
    if (owner) return owner === userId;
    return (
      m.id === rowMembershipId ||
      (m.user_id != null && m.user_id === membership.user_id)
    );
  });
}

/** Plan changes alter branding and paused guides, so cached pages are refreshed. */
async function revalidateOwnedGuides(supabase: Admin, userId: string) {
  const { data } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", userId)
    .eq("role", "owner");
  await Promise.all(
    (data ?? []).map((row) => revalidateBusiness(supabase, row.business_id)),
  );
}
