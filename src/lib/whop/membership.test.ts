import { describe, expect, it } from "vitest";

import {
  bestGrantingPatch,
  billingPeriodFromDays,
  decide,
  grantsAccess,
  mapStatus,
  metadataUserId,
  type CurrentRow,
  type WhopMembership,
} from "./membership";

const products = {
  essential: "prod_ess",
  plus: "prod_plus",
  variants: new Set(["plan_ess_m", "plan_ess_y", "plan_plus_m", "plan_plus_y"]),
};
const USER = "5b2c3d4e-1111-4222-8333-944455556666";

const membership = (over: Partial<WhopMembership> = {}): WhopMembership => ({
  id: "mem_A",
  status: "active",
  user_id: "user_X",
  product_id: "prod_ess",
  variant_id: "plan_ess_m",
  billing_period_days: 30,
  current_period_end: "2026-12-23T23:43:00Z",
  metadata: { supabase_user_id: USER },
  ...over,
});

const row = (over: Partial<NonNullable<CurrentRow>> = {}): CurrentRow => ({
  plan: "essential",
  status: "trialing",
  provider: null,
  provider_subscription_id: null,
  current_period_end: null,
  ...over,
});

describe("helpers", () => {
  it("maps billing periods", () => {
    expect(billingPeriodFromDays(30)).toBe("monthly");
    expect(billingPeriodFromDays(31)).toBe("monthly");
    expect(billingPeriodFromDays(365)).toBe("annual");
    expect(billingPeriodFromDays(null)).toBeNull();
    expect(billingPeriodFromDays(7)).toBeNull();
  });

  it("maps Whop statuses", () => {
    expect(mapStatus("active")).toBe("active");
    expect(mapStatus("trialing")).toBe("active");
    expect(mapStatus("unresolved")).toBe("past_due");
    expect(mapStatus("completed")).toBe("active");
    expect(mapStatus("canceled")).toBe("canceled");
    expect(mapStatus("weird")).toBeNull();
  });

  it("reads only a uuid from metadata", () => {
    expect(metadataUserId(membership())).toBe(USER);
    expect(
      metadataUserId(membership({ metadata: { supabase_user_id: "x" } })),
    ).toBeNull();
    expect(metadataUserId(membership({ metadata: null }))).toBeNull();
  });
});

describe("decide", () => {
  it("activates a paid plan over our trial", () => {
    expect(decide(membership(), row(), products)).toEqual({
      action: "apply",
      patch: {
        plan: "essential",
        status: "active",
        billing_period: "monthly",
        current_period_end: "2026-12-23T23:43:00Z",
        provider: "whop",
        provider_customer_id: "user_X",
        provider_subscription_id: "mem_A",
      },
    });
  });

  it("creates the row when none exists", () => {
    const result = decide(
      membership({
        product_id: "prod_plus",
        variant_id: "plan_plus_y",
        billing_period_days: 365,
      }),
      null,
      products,
    );
    expect(result.action).toBe("apply");
    if (result.action === "apply") {
      expect(result.patch.plan).toBe("plus");
      expect(result.patch.billing_period).toBe("annual");
    }
  });

  const now = new Date("2026-11-24T12:00:00Z");
  const own = () =>
    row({
      status: "active",
      provider: "whop",
      provider_subscription_id: "mem_A",
    });

  it("keeps a scheduled cancellation until the period end", () => {
    const result = decide(
      membership({ status: "active", cancel_at_period_end: true }),
      own(),
      products,
      now,
    );
    expect(result).toMatchObject({
      action: "apply",
      patch: { status: "canceled", current_period_end: "2026-12-23T23:43:00Z" },
    });
  });

  it("ends access right away on an immediate cancellation", () => {
    const result = decide(
      membership({ status: "canceled", canceled_at: "2026-11-24T10:00:00Z" }),
      own(),
      products,
      now,
    );
    expect(result).toMatchObject({
      action: "apply",
      patch: {
        status: "canceled",
        current_period_end: "2026-11-24T10:00:00.000Z",
      },
    });
  });

  it("never dates an immediate cancellation in the future", () => {
    const result = decide(
      membership({ status: "canceled", canceled_at: null }),
      own(),
      products,
      now,
    );
    expect(result).toMatchObject({
      patch: { status: "canceled", current_period_end: now.toISOString() },
    });
  });

  it("keeps access for a completed one-time purchase", () => {
    const lifetime = decide(
      membership({
        status: "completed",
        billing_period_days: null,
        current_period_end: null,
      }),
      own(),
      products,
      now,
    );
    expect(lifetime).toMatchObject({
      action: "apply",
      patch: {
        status: "active",
        current_period_end: null,
        billing_period: null,
      },
    });
    const limited = decide(
      membership({ status: "completed", expires_at: "2027-11-24T00:00:00Z" }),
      own(),
      products,
      now,
    );
    expect(limited).toMatchObject({
      patch: { status: "canceled", current_period_end: "2027-11-24T00:00:00Z" },
    });
  });

  it("does not let another membership's scheduled cancellation take over", () => {
    const current = row({
      plan: "plus",
      status: "active",
      provider: "whop",
      provider_subscription_id: "mem_PLUS",
    });
    expect(
      decide(
        membership({ cancel_at_period_end: true }),
        current,
        products,
        now,
      ),
    ).toEqual({ action: "skip", reason: "other_membership_has_higher_plan" });
  });

  it("keeps a Plus whose cancellation is scheduled but still running", () => {
    const current = row({
      plan: "plus",
      status: "canceled",
      provider: "whop",
      provider_subscription_id: "mem_PLUS",
      current_period_end: "2027-01-10T00:00:00Z",
    });
    expect(decide(membership(), current, products, now)).toEqual({
      action: "skip",
      reason: "other_membership_has_higher_plan",
    });
  });

  it("replaces a Plus row whose access already ended", () => {
    const current = row({
      plan: "plus",
      status: "canceled",
      provider: "whop",
      provider_subscription_id: "mem_PLUS",
      current_period_end: "2026-11-01T00:00:00Z",
    });
    expect(decide(membership(), current, products, now)).toMatchObject({
      action: "apply",
      patch: { plan: "essential", provider_subscription_id: "mem_A" },
    });
  });

  it("applies a fixed-term purchase over an old expired membership", () => {
    const current = row({
      plan: "free",
      status: "expired",
      provider: "whop",
      provider_subscription_id: "mem_OLD",
    });
    const result = decide(
      membership({
        status: "completed",
        expires_at: "2027-11-24T00:00:00Z",
        billing_period_days: null,
      }),
      current,
      products,
      now,
    );
    expect(result).toMatchObject({
      action: "apply",
      patch: { status: "canceled", current_period_end: "2027-11-24T00:00:00Z" },
    });
  });

  it("ignores an ended membership when the row has no access either", () => {
    const current = row({
      plan: "free",
      status: "expired",
      provider: "whop",
      provider_subscription_id: "mem_OLD",
    });
    expect(
      decide(membership({ status: "expired" }), current, products, now),
    ).toEqual({ action: "skip", reason: "no_membership_grants_access" });
  });
  it("ignores unknown products and the managers plan", () => {
    expect(
      decide(membership({ product_id: "prod_other" }), row(), products),
    ).toEqual({
      action: "skip",
      reason: "unknown_product",
    });
    expect(decide(membership(), row({ plan: "managers" }), products)).toEqual({
      action: "skip",
      reason: "managers_plan",
    });
  });

  it("does not let an ending membership override another current one", () => {
    const current = row({
      plan: "plus",
      status: "active",
      provider: "whop",
      provider_subscription_id: "mem_PLUS",
    });
    expect(
      decide(membership({ status: "canceled" }), current, products),
    ).toEqual({
      action: "skip",
      reason: "other_membership_is_current",
    });
  });

  it("does not downgrade a live Plus because a live Essential event arrives", () => {
    const current = row({
      plan: "plus",
      status: "active",
      provider: "whop",
      provider_subscription_id: "mem_PLUS",
    });
    expect(decide(membership(), current, products)).toEqual({
      action: "skip",
      reason: "other_membership_has_higher_plan",
    });
  });

  it("lets a new Plus membership replace a live Essential one (upgrade)", () => {
    const current = row({
      plan: "essential",
      status: "active",
      provider: "whop",
      provider_subscription_id: "mem_A",
    });
    const result = decide(
      membership({
        id: "mem_PLUS",
        product_id: "prod_plus",
        variant_id: "plan_plus_y",
        billing_period_days: 365,
      }),
      current,
      products,
    );
    expect(result).toMatchObject({
      action: "apply",
      patch: { plan: "plus", provider_subscription_id: "mem_PLUS" },
    });
  });
});

describe("grantsAccess", () => {
  const now = new Date("2026-11-24T12:00:00Z");
  it("mirrors effective_plan for paid rows", () => {
    expect(grantsAccess("active", null, now)).toBe(true);
    expect(grantsAccess("active", "2026-11-20T00:00:00Z", now)).toBe(true);
    expect(grantsAccess("active", "2026-11-10T00:00:00Z", now)).toBe(false);
    expect(grantsAccess("past_due", null, now)).toBe(false);
    expect(grantsAccess("past_due", "2026-11-20T00:00:00Z", now)).toBe(true);
    expect(grantsAccess("canceled", "2026-11-25T00:00:00Z", now)).toBe(true);
    expect(grantsAccess("canceled", "2026-11-24T00:00:00Z", now)).toBe(false);
    expect(grantsAccess("expired", null, now)).toBe(false);
  });
});

describe("price allowlist", () => {
  it("skips a membership bought through a price we do not sell", () => {
    expect(
      decide(membership({ variant_id: "plan_free" }), row(), products),
    ).toEqual({
      action: "skip",
      reason: "unknown_variant",
    });
    expect(decide(membership({ variant_id: null }), row(), products)).toEqual({
      action: "skip",
      reason: "unknown_variant",
    });
  });
});

describe("bestGrantingPatch", () => {
  const now = new Date("2026-11-24T12:00:00Z");

  it("picks the highest plan that still grants access", () => {
    const ended = membership({
      id: "mem_PLUS",
      product_id: "prod_plus",
      variant_id: "plan_plus_y",
      status: "expired",
    });
    const essential = membership({ id: "mem_ESS" });
    expect(bestGrantingPatch([ended, essential], products, now)).toMatchObject({
      plan: "essential",
      provider_subscription_id: "mem_ESS",
    });
  });

  it("prefers the later end for the same plan", () => {
    const sooner = membership({
      id: "mem_1",
      current_period_end: "2026-12-01T00:00:00Z",
    });
    const later = membership({
      id: "mem_2",
      current_period_end: "2027-01-01T00:00:00Z",
    });
    expect(
      bestGrantingPatch([sooner, later], products, now)
        ?.provider_subscription_id,
    ).toBe("mem_2");
  });

  it("returns null when nothing grants access", () => {
    expect(
      bestGrantingPatch(
        [
          membership({ status: "expired" }),
          membership({ variant_id: "plan_free" }),
        ],
        products,
        now,
      ),
    ).toBeNull();
  });
});
