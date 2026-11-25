import type { Database } from "@/lib/supabase/database.types";

/**
 * Pure mapping from a Whop membership to our `subscriptions` row.
 *
 * Whop is the source of truth for paid plans: every membership event carries the
 * full membership object, and the route re-reads it from the API when it can, so
 * events that arrive out of order still end on the current state.
 */

type Enums = Database["public"]["Enums"];
export type PlanTier = Enums["plan_tier"];
export type SubscriptionStatus = Enums["subscription_status"];
export type BillingPeriod = Enums["billing_period"];

/** The membership fields we use (Whop API v1 Membership object). */
export type WhopMembership = {
  id: string;
  status: string;
  user_id: string | null;
  product_id: string;
  variant_id?: string | null;
  billing_period_days: number | null;
  current_period_end: string | null;
  cancel_at_period_end?: boolean;
  canceled_at?: string | null;
  expires_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Whop product ids for each paid plan, plus the exact prices (variants, `plan_...`)
 * we sell. They differ between sandbox and production. The price allowlist matters:
 * a product can hold other pricing options (a free or discounted one, a test price),
 * and a membership bought through one of those must not unlock the plan.
 */
export type ProductMap = {
  essential: string | null;
  plus: string | null;
  variants: ReadonlySet<string>;
};

/** Key we put in checkout metadata to link the payment to a Supabase user. */
export const METADATA_USER_KEY = "supabase_user_id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function metadataUserId(membership: WhopMembership): string | null {
  const value = membership.metadata?.[METADATA_USER_KEY];
  return typeof value === "string" && UUID_RE.test(value) ? value : null;
}

export function planForProduct(
  productId: string,
  products: ProductMap,
): PlanTier | null {
  if (products.essential && productId === products.essential)
    return "essential";
  if (products.plus && productId === products.plus) return "plus";
  return null;
}

/** Whop bills monthly plans every ~30 days and annual ones every 365. */
export function billingPeriodFromDays(
  days: number | null,
): BillingPeriod | null {
  if (days == null) return null;
  if (days >= 300) return "annual";
  if (days >= 25 && days <= 35) return "monthly";
  return null;
}

/**
 * Whop statuses: trialing, active, past_due, completed, canceled, expired, unresolved.
 * Our own 30-day trial runs without Whop, so a Whop trial is stored as `active` until
 * its period end (our `trialing` rows require trial_ends_at). `unresolved` is a
 * payment problem being worked out, treated like past_due (our effective_plan keeps
 * the plan for 7 days after the period end). `completed` is a finished one-time
 * purchase that keeps its access (until expires_at, if any): see subscriptionTiming.
 *
 * Whop `canceled` means access is already gone; a cancellation scheduled for the end
 * of the period stays `active` with cancel_at_period_end. `decide` maps both onto our
 * `canceled`, whose access lasts until current_period_end (see subscriptionTiming).
 */
export function mapStatus(status: string): SubscriptionStatus | null {
  switch (status) {
    case "trialing":
      return "active";
    case "active":
    case "past_due":
    case "canceled":
    case "expired":
      return status;
    case "unresolved":
      return "past_due";
    case "completed":
      return "active";
    default:
      return null;
  }
}

/**
 * Status and access end for our row. Our `canceled` keeps the plan until
 * current_period_end (effective_plan), so:
 *   - scheduled cancellation (live + cancel_at_period_end): `canceled` until the
 *     period end, with no grace week;
 *   - immediate cancellation (Whop `canceled`): `canceled` ending at canceled_at, or
 *     now, whichever is earlier, so access stops right away. The daily job then
 *     moves the row to Free and emails the owner;
 *   - completed one-time purchase: keeps access. With expires_at it is stored as
 *     `canceled` ending then (no renewal, no grace week); without it, `active` with
 *     no end (lifetime access).
 */
export function subscriptionTiming(
  membership: WhopMembership,
  status: SubscriptionStatus,
  now: Date,
): { status: SubscriptionStatus; current_period_end: string | null } {
  if (membership.status === "canceled") {
    const canceledAt = membership.canceled_at
      ? new Date(membership.canceled_at)
      : null;
    const end =
      canceledAt && !Number.isNaN(canceledAt.getTime()) && canceledAt < now
        ? canceledAt
        : now;
    return { status: "canceled", current_period_end: end.toISOString() };
  }
  if (membership.status === "completed") {
    return membership.expires_at
      ? { status: "canceled", current_period_end: membership.expires_at }
      : { status: "active", current_period_end: null };
  }
  if (
    (status === "active" || status === "past_due") &&
    membership.cancel_at_period_end
  ) {
    return {
      status: "canceled",
      current_period_end: membership.current_period_end,
    };
  }
  return { status, current_period_end: membership.current_period_end };
}

/** Grace after a missed payment or an unrenewed period, as in effective_plan(). */
const GRACE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Whether a row with this status and period end grants its plan right now. Mirrors
 * effective_plan() (migration 12) for paid rows: active keeps the plan until 7 days
 * after the period end (none = no end), past_due until 7 days after it, canceled until
 * the period end itself, expired never. Our own trial is not a Whop row and never
 * reaches this comparison.
 */
export function grantsAccess(
  status: SubscriptionStatus,
  periodEnd: string | null,
  now: Date,
): boolean {
  const end = periodEnd ? new Date(periodEnd).getTime() : null;
  if (end != null && Number.isNaN(end)) return false;
  switch (status) {
    case "active":
      return end == null || end + GRACE_MS > now.getTime();
    case "past_due":
      return end != null && end + GRACE_MS > now.getTime();
    case "canceled":
      return end != null && end > now.getTime();
    default:
      return false;
  }
}

const PLAN_RANK: Record<PlanTier, number> = {
  free: 0,
  essential: 1,
  plus: 2,
  managers: 3,
};

export type CurrentRow = {
  plan: PlanTier;
  status: SubscriptionStatus;
  provider: string | null;
  provider_subscription_id: string | null;
  current_period_end: string | null;
} | null;

export type SubscriptionPatch = {
  plan: PlanTier;
  status: SubscriptionStatus;
  billing_period: BillingPeriod | null;
  current_period_end: string | null;
  provider: "whop";
  provider_customer_id: string | null;
  provider_subscription_id: string;
};

/**
 * Among several memberships of one user, the one that should back the row: the
 * highest plan that grants access right now, then the latest end. Null when none
 * grants access. Used when the row's own membership stops granting access, so a
 * second membership that was skipped earlier (for example an Essential bought while
 * a Plus was still running) takes over instead of leaving a paying user on Free.
 */
export function bestGrantingPatch(
  memberships: readonly WhopMembership[],
  products: ProductMap,
  now: Date = new Date(),
): SubscriptionPatch | null {
  let best: SubscriptionPatch | null = null;
  for (const membership of memberships) {
    const decision = decide(membership, null, products, now);
    if (decision.action !== "apply") continue;
    const patch = decision.patch;
    if (!grantsAccess(patch.status, patch.current_period_end, now)) continue;
    if (
      !best ||
      PLAN_RANK[patch.plan] > PLAN_RANK[best.plan] ||
      (PLAN_RANK[patch.plan] === PLAN_RANK[best.plan] &&
        endTime(patch.current_period_end) > endTime(best.current_period_end))
    ) {
      best = patch;
    }
  }
  return best;
}

/** No end date sorts last (lifetime access). */
function endTime(value: string | null): number {
  return value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
}

export type Decision =
  | { action: "apply"; patch: SubscriptionPatch }
  | { action: "skip"; reason: string };

/**
 * Decides what a membership means for the user's single subscription row.
 *
 * One row per user, so when a buyer ends up with two memberships (for example
 * Essential and then Plus) the row follows the best one that still grants access,
 * judged by status and end date (grantsAccess), not by status alone: a membership
 * without access never replaces a row pointing at another Whop membership, one with
 * access replaces it unless that row still grants a higher plan, and an
 * admin-managed `managers` plan is never touched.
 */
export function decide(
  membership: WhopMembership,
  current: CurrentRow,
  products: ProductMap,
  now: Date = new Date(),
): Decision {
  const plan = planForProduct(membership.product_id, products);
  if (!plan) return { action: "skip", reason: "unknown_product" };
  if (!membership.variant_id || !products.variants.has(membership.variant_id)) {
    return { action: "skip", reason: "unknown_variant" };
  }

  const status = mapStatus(membership.status);
  if (!status)
    return { action: "skip", reason: `unknown_status:${membership.status}` };

  if (current?.plan === "managers") {
    return { action: "skip", reason: "managers_plan" };
  }

  const pointsElsewhere =
    current?.provider === "whop" &&
    current.provider_subscription_id != null &&
    current.provider_subscription_id !== membership.id;
  const timing = subscriptionTiming(membership, status, now);
  if (pointsElsewhere) {
    // Compare what each membership is worth right now, by status and end date.
    const incomingGrants = grantsAccess(
      timing.status,
      timing.current_period_end,
      now,
    );
    const currentGrants = grantsAccess(
      current.status,
      current.current_period_end,
      now,
    );
    if (!incomingGrants && currentGrants) {
      return { action: "skip", reason: "other_membership_is_current" };
    }
    if (!incomingGrants && !currentGrants) {
      return { action: "skip", reason: "no_membership_grants_access" };
    }
    if (currentGrants && PLAN_RANK[current.plan] > PLAN_RANK[plan]) {
      return { action: "skip", reason: "other_membership_has_higher_plan" };
    }
  }

  return {
    action: "apply",
    patch: {
      plan,
      ...timing,
      billing_period: billingPeriodFromDays(membership.billing_period_days),
      provider: "whop",
      provider_customer_id: membership.user_id,
      provider_subscription_id: membership.id,
    },
  };
}
