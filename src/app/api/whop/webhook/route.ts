import { revalidateBusiness } from "@/lib/admin/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMembership } from "@/lib/whop/api";
import { whopConfig } from "@/lib/whop/config";
import {
  decide,
  metadataUserId,
  type WhopMembership,
} from "@/lib/whop/membership";
import { verifyWhopSignature } from "@/lib/whop/signature";

/**
 * Whop webhook receiver (Developer > Webhooks in the Whop dashboard).
 *
 *   1. Verifies the signature over the raw body (WHOP_WEBHOOK_SECRET).
 *   2. Stores every event in billing_events. The unique (provider, provider_event_id)
 *      key makes redeliveries no-ops; an event whose processing failed is retried.
 *   3. membership.* events update the user's row in `subscriptions`. Payment events
 *      are only recorded: Whop reflects their effect (activation, past_due) in a
 *      membership event too.
 *
 * Users are linked through checkout metadata (`supabase_user_id`), or, for later
 * events, through the Whop membership/customer ids saved on the first one.
 * Whop expects a 2xx within 5 seconds; a 5xx makes it retry with backoff.
 */
export const dynamic = "force-dynamic";

const PROVIDER = "whop";

type Admin = ReturnType<typeof createAdminClient>;
type WhopEvent = { id?: string; type?: string; data?: unknown };

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status });

export async function POST(request: Request) {
  const config = whopConfig();
  if (!config.webhookSecret) {
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
    await markEvent(supabase, eventId, note.startsWith("error:") ? note : null);
    return json({ ok: true, result: note });
  } catch (error) {
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

  const membership = (await fetchMembership(config, payload.id)) ?? payload;
  const userId = await resolveUser(supabase, membership, payload);
  if (!userId) return "error:unmatched_user";

  const { data: current, error: readError } = await supabase
    .from("subscriptions")
    .select("plan, status, provider, provider_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) throw new Error(`read subscription: ${readError.message}`);

  const decision = decide(membership, current, config.products);
  if (decision.action === "skip") return `skipped:${decision.reason}`;

  const { error } = await supabase
    .from("subscriptions")
    .upsert({ user_id: userId, ...decision.patch }, { onConflict: "user_id" });
  if (error) throw new Error(`upsert subscription: ${error.message}`);

  await revalidateOwnedGuides(supabase, userId);
  return `applied:${decision.patch.plan}:${decision.patch.status}`;
}

/** Checkout metadata first, then the Whop ids saved by an earlier event. */
async function resolveUser(
  supabase: Admin,
  membership: WhopMembership,
  payload: WhopMembership,
): Promise<string | null> {
  const fromMetadata = metadataUserId(membership) ?? metadataUserId(payload);
  if (fromMetadata) return fromMetadata;

  const byMembership = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("provider", PROVIDER)
    .eq("provider_subscription_id", membership.id)
    .maybeSingle();
  if (byMembership.data) return byMembership.data.user_id;

  if (!membership.user_id) return null;
  const byCustomer = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("provider", PROVIDER)
    .eq("provider_customer_id", membership.user_id)
    .limit(1)
    .maybeSingle();
  return byCustomer.data?.user_id ?? null;
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
