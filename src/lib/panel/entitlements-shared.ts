import { z } from "zod";

import {
  BILLING_PERIODS,
  PLAN_IDS,
  type BillingPeriod,
  type PlanId,
} from "@/lib/plans";

/**
 * What my_entitlements() returns (supabase/migrations/20261117000012_subscriptions.sql).
 * Pure helpers live here so they can be unit tested; the loader is in entitlements.ts.
 */
const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "expired",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

const entitlementsSchema = z.object({
  plan: z.enum(PLAN_IDS),
  subscribed_plan: z.enum(PLAN_IDS).nullable().optional(),
  status: z.enum(SUBSCRIPTION_STATUSES).nullable().optional(),
  billing_period: z.enum(BILLING_PERIODS).nullable().optional(),
  trial_ends_at: z.string().nullable().optional(),
  current_period_end: z.string().nullable().optional(),
  property_limit: z.number().int(),
  properties_used: z.number().int(),
});

export type Entitlements = {
  /** Plan in effect right now (trial and grace periods already applied). */
  plan: PlanId;
  /** Plan stored on the subscription, which can differ from `plan` once it lapses. */
  subscribedPlan: PlanId | null;
  status: SubscriptionStatus | null;
  billingPeriod: BillingPeriod | null;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  propertyLimit: number;
  propertiesUsed: number;
};

/** At or above this, the limit is shown as "no limit" (managers default to 1000). */
export const UNLIMITED_PROPERTIES = 1000;

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseEntitlements(raw: unknown): Entitlements | null {
  const parsed = entitlementsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const e = parsed.data;
  return {
    plan: e.plan,
    subscribedPlan: e.subscribed_plan ?? null,
    status: e.status ?? null,
    billingPeriod: e.billing_period ?? null,
    trialEndsAt: toDate(e.trial_ends_at),
    currentPeriodEnd: toDate(e.current_period_end),
    propertyLimit: e.property_limit,
    propertiesUsed: e.properties_used,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

export type TrialState =
  | { kind: "trial"; plan: PlanId; daysLeft: number; endsAt: Date }
  /** The trial (or a paid plan) lapsed and the account now runs on Free. */
  | { kind: "lapsed" }
  | null;

/**
 * Trial banner state. `daysLeft` rounds up, so a trial ending in 3 hours shows
 * "1 day" and never "0 days".
 */
export function trialState(
  e: Entitlements | null,
  now: Date = new Date(),
): TrialState {
  if (!e) return null;
  if (e.status === "trialing" && e.trialEndsAt) {
    const remaining = e.trialEndsAt.getTime() - now.getTime();
    if (remaining > 0 && e.plan !== "free") {
      return {
        kind: "trial",
        plan: e.plan,
        daysLeft: Math.max(1, Math.ceil(remaining / DAY_MS)),
        endsAt: e.trialEndsAt,
      };
    }
    return { kind: "lapsed" };
  }
  if (e.status === "expired" && e.plan === "free") return { kind: "lapsed" };
  return null;
}

/** The banner gets louder in the last days of the trial. */
export const TRIAL_URGENT_DAYS = 7;

function compareIds(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export type OwnedGuide = { id: string; createdAt: string; status: string };

/**
 * Guides paused by the plan: the owner's non-archived guides ranked by age, where
 * the ones past the limit are paused. Mirrors business_is_paused_by_plan() in the
 * same migration (ties on created_at are broken by id, like the SQL tuple compare;
 * lowercase UUID strings sort in the same order as Postgres uuids).
 */
export function pausedGuideIds(
  owned: readonly OwnedGuide[],
  limit: number,
): Set<string> {
  const ranked = owned
    .filter((guide) => guide.status !== "archived")
    .map((guide) => ({ ...guide, time: new Date(guide.createdAt).getTime() }))
    .sort((a, b) => a.time - b.time || compareIds(a.id, b.id));
  return new Set(ranked.slice(Math.max(0, limit)).map((guide) => guide.id));
}
