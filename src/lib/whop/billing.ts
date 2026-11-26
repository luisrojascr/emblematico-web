import {
  grantsAccess,
  type PlanTier,
  type SubscriptionPatch,
  type SubscriptionStatus,
  type WhopMembership,
} from "./membership";

/**
 * What the panel offers for paying, from the user's subscription row. Pure, so the
 * page and the server actions agree and it can be unit tested.
 *
 *   - "checkout": pay online through Whop (trial, Free, or a plan that lapsed).
 *   - "manage": a Whop membership still backs the plan; the buyer updates the card,
 *     cancels or resumes in Whop's portal. A second purchase would only create a
 *     parallel membership.
 *   - "contact": online payment is off, the account is a managers plan or an admin,
 *     or a plan paid by hand is still running (buying online now would replace it
 *     and lose the time already paid).
 */
export type BillingMode = "checkout" | "manage" | "contact";

export type BillingRow = {
  plan: PlanTier;
  status: SubscriptionStatus;
  provider: string | null;
  provider_subscription_id: string | null;
  current_period_end: string | null;
} | null;

export function billingMode(
  row: BillingRow,
  input: { onlineEnabled: boolean; isAdmin: boolean; now?: Date },
): BillingMode {
  const now = input.now ?? new Date();
  if (input.isAdmin || row?.plan === "managers") return "contact";
  if (!input.onlineEnabled) return "contact";
  if (!row) return "checkout";

  const live =
    row.status !== "trialing" &&
    grantsAccess(row.status, row.current_period_end, now);
  if (row.provider === "whop" && row.provider_subscription_id && live) {
    return "manage";
  }
  if (
    row.provider !== "whop" &&
    (row.plan === "essential" || row.plan === "plus") &&
    live
  ) {
    return "contact";
  }
  return "checkout";
}

/**
 * Where Whop sends the buyer back after paying: the origin the request came from
 * (so a preview deployment returns to itself), if it is https or local, else the
 * site's own URL.
 */
export function returnOrigin(
  requestOrigin: string | null,
  siteUrl: string,
): string {
  if (requestOrigin) {
    try {
      const url = new URL(requestOrigin);
      const local =
        url.protocol === "http:" &&
        (url.hostname === "localhost" || url.hostname === "127.0.0.1");
      if (url.protocol === "https:" || local) return url.origin;
    } catch {
      // Fall through to the site URL.
    }
  }
  return new URL(siteUrl).origin;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The plan and end date to announce when this update is a cancellation the buyer
 * scheduled for the period end (Whop's portal "Cancel"), so we can email them in
 * Spanish. Immediate cancellations end now and get the daily job's "dropped to
 * Free" email instead; a period ending within a day is not worth a separate email.
 */
export function scheduledCancellation(
  membership: WhopMembership,
  patch: SubscriptionPatch,
  now: Date = new Date(),
): { plan: PlanTier; periodEnd: Date } | null {
  if (!membership.cancel_at_period_end) return null;
  if (membership.status === "canceled" || membership.status === "completed") {
    return null;
  }
  if (patch.status !== "canceled" || !patch.current_period_end) return null;
  const end = new Date(patch.current_period_end);
  if (Number.isNaN(end.getTime()) || end.getTime() - now.getTime() < DAY_MS) {
    return null;
  }
  return { plan: patch.plan, periodEnd: end };
}
