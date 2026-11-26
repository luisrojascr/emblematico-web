import { describe, expect, it } from "vitest";

import {
  billingMode,
  returnOrigin,
  scheduledCancellation,
  type BillingRow,
} from "./billing";
import type { SubscriptionPatch, WhopMembership } from "./membership";

const now = new Date("2026-11-26T12:00:00Z");
const inDays = (days: number) =>
  new Date(now.getTime() + days * 86_400_000).toISOString();

function row(overrides: Partial<NonNullable<BillingRow>> = {}): BillingRow {
  return {
    plan: "essential",
    status: "active",
    provider: "whop",
    provider_subscription_id: "mem_abc",
    current_period_end: inDays(20),
    ...overrides,
  };
}

const on = { onlineEnabled: true, isAdmin: false, now };

describe("billingMode", () => {
  it("sells online to trials, Free accounts and accounts without a row", () => {
    expect(billingMode(null, on)).toBe("checkout");
    expect(
      billingMode(
        row({
          status: "trialing",
          provider: null,
          provider_subscription_id: null,
        }),
        on,
      ),
    ).toBe("checkout");
    expect(
      billingMode(
        row({
          plan: "free",
          status: "expired",
          provider: null,
          provider_subscription_id: null,
        }),
        on,
      ),
    ).toBe("checkout");
  });

  it("sends live Whop members to the portal instead of a second purchase", () => {
    expect(billingMode(row(), on)).toBe("manage");
    expect(billingMode(row({ status: "canceled" }), on)).toBe("manage");
    expect(
      billingMode(
        row({ status: "past_due", current_period_end: inDays(-3) }),
        on,
      ),
    ).toBe("manage");
  });

  it("sells again once the Whop plan no longer grants access", () => {
    expect(
      billingMode(
        row({ status: "canceled", current_period_end: inDays(-1) }),
        on,
      ),
    ).toBe("checkout");
    expect(billingMode(row({ status: "expired" }), on)).toBe("checkout");
  });

  it("keeps hand-paid plans, managers and admins on the contact form", () => {
    expect(
      billingMode(
        row({ provider: "manual", provider_subscription_id: null }),
        on,
      ),
    ).toBe("contact");
    expect(billingMode(row({ plan: "managers", provider: null }), on)).toBe(
      "contact",
    );
    expect(billingMode(null, { ...on, isAdmin: true })).toBe("contact");
  });

  it("lets a lapsed hand-paid plan buy online", () => {
    expect(
      billingMode(
        row({
          provider: "manual",
          provider_subscription_id: null,
          status: "canceled",
          current_period_end: inDays(-2),
        }),
        on,
      ),
    ).toBe("checkout");
  });

  it("uses the contact form for everyone while online payment is off", () => {
    const off = { ...on, onlineEnabled: false };
    expect(billingMode(null, off)).toBe("contact");
    expect(billingMode(row(), off)).toBe("contact");
  });
});

describe("returnOrigin", () => {
  const site = "https://www.emblematicocr.com";
  it("returns to the deployment the request came from", () => {
    expect(returnOrigin("https://preview-abc.vercel.app", site)).toBe(
      "https://preview-abc.vercel.app",
    );
    expect(returnOrigin("http://localhost:3000", site)).toBe(
      "http://localhost:3000",
    );
  });

  it("falls back to the site for missing or unsafe origins", () => {
    expect(returnOrigin(null, site)).toBe(site);
    expect(returnOrigin("http://evil.example", site)).toBe(site);
    expect(returnOrigin("not a url", site)).toBe(site);
  });
});

describe("scheduledCancellation", () => {
  const membership = (m: Partial<WhopMembership> = {}): WhopMembership => ({
    id: "mem_abc",
    status: "active",
    user_id: "user_1",
    product_id: "prod_e",
    billing_period_days: 30,
    current_period_end: inDays(20),
    cancel_at_period_end: true,
    ...m,
  });
  const patch = (p: Partial<SubscriptionPatch> = {}): SubscriptionPatch => ({
    plan: "essential",
    status: "canceled",
    billing_period: "monthly",
    current_period_end: inDays(20),
    provider: "whop",
    provider_customer_id: "user_1",
    provider_subscription_id: "mem_abc",
    ...p,
  });

  it("announces a cancellation scheduled for the period end", () => {
    expect(scheduledCancellation(membership(), patch(), now)).toEqual({
      plan: "essential",
      periodEnd: new Date(inDays(20)),
    });
  });

  it("ignores immediate cancellations, resumes and periods about to end", () => {
    expect(
      scheduledCancellation(membership({ status: "canceled" }), patch(), now),
    ).toBeNull();
    expect(
      scheduledCancellation(
        membership({ cancel_at_period_end: false }),
        patch({ status: "active" }),
        now,
      ),
    ).toBeNull();
    expect(
      scheduledCancellation(
        membership(),
        patch({ current_period_end: inDays(0.5) }),
        now,
      ),
    ).toBeNull();
  });
});
