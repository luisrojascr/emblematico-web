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

/** Whop product ids for each paid plan (they differ between sandbox and production). */
export type ProductMap = {
  essential: string | null;
  plus: string | null;
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

/** Statuses that grant (or are about to keep granting) the paid plan. */
const LIVE_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  "active",
  "past_due",
]);

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

export type Decision =
  | { action: "apply"; patch: SubscriptionPatch }
  | { action: "skip"; reason: string };

/**
 * Decides what a membership means for the user's single subscription row.
 *
 * One row per user, so when a buyer ends up with two memberships (for example
 * Essential and then Plus) the row follows the best live one: an ending membership
 * never overwrites a row that points at a different Whop membership, a live one only
 * replaces another live one with an equal or higher plan, and an admin-managed
 * `managers` plan is never touched.
 */
export function decide(
  membership: WhopMembership,
  current: CurrentRow,
  products: ProductMap,
  now: Date = new Date(),
): Decision {
  const plan = planForProduct(membership.product_id, products);
  if (!plan) return { action: "skip", reason: "unknown_product" };

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
  if (pointsElsewhere && !LIVE_STATUSES.has(timing.status)) {
    return { action: "skip", reason: "other_membership_is_current" };
  }
  if (
    pointsElsewhere &&
    LIVE_STATUSES.has(current.status) &&
    PLAN_RANK[current.plan] > PLAN_RANK[plan]
  ) {
    return { action: "skip", reason: "other_membership_has_higher_plan" };
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
