import { describe, expect, it } from "vitest";

import {
  billingPeriodFromDays,
  decide,
  mapStatus,
  metadataUserId,
  type CurrentRow,
  type WhopMembership,
} from "./membership";

const products = { essential: "prod_ess", plus: "prod_plus" };
const USER = "5b2c3d4e-1111-4222-8333-944455556666";

const membership = (over: Partial<WhopMembership> = {}): WhopMembership => ({
  id: "mem_A",
  status: "active",
  user_id: "user_X",
  product_id: "prod_ess",
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
      membership({ product_id: "prod_plus", billing_period_days: 365 }),
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
    ).toEqual({ action: "skip", reason: "other_membership_is_current" });
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
