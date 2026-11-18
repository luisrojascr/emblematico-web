import { describe, expect, it } from "vitest";

import {
  parseEntitlements,
  pausedGuideIds,
  trialState,
  type Entitlements,
} from "./entitlements-shared";

const now = new Date("2026-11-18T12:00:00Z");
const inDays = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

function entitlements(patch: Partial<Entitlements> = {}): Entitlements {
  return {
    plan: "essential",
    subscribedPlan: "essential",
    status: "trialing",
    billingPeriod: null,
    trialEndsAt: new Date(inDays(30)),
    currentPeriodEnd: null,
    propertyLimit: 3,
    propertiesUsed: 1,
    ...patch,
  };
}

describe("parseEntitlements", () => {
  it("reads my_entitlements() output", () => {
    const parsed = parseEntitlements({
      plan: "essential",
      subscribed_plan: "essential",
      status: "trialing",
      billing_period: null,
      trial_ends_at: "2026-12-17T12:00:00+00:00",
      current_period_end: null,
      property_limit: 3,
      properties_used: 0,
    });
    expect(parsed?.plan).toBe("essential");
    expect(parsed?.trialEndsAt?.toISOString()).toBe("2026-12-17T12:00:00.000Z");
    expect(parsed?.propertyLimit).toBe(3);
  });

  it("tolerates a missing subscription row and rejects junk", () => {
    expect(
      parseEntitlements({
        plan: "free",
        subscribed_plan: null,
        status: null,
        property_limit: 1,
        properties_used: 0,
      })?.status,
    ).toBeNull();
    expect(parseEntitlements(null)).toBeNull();
    expect(parseEntitlements({ plan: "gold" })).toBeNull();
  });
});

describe("trialState", () => {
  it("counts days left, rounding up", () => {
    expect(trialState(entitlements(), now)).toMatchObject({
      kind: "trial",
      daysLeft: 30,
    });
    const hours = entitlements({
      trialEndsAt: new Date(now.getTime() + 3 * 60 * 60 * 1000),
    });
    expect(trialState(hours, now)).toMatchObject({ daysLeft: 1 });
  });

  it("reports a lapsed trial before and after the daily job runs", () => {
    const ended = entitlements({
      plan: "free",
      trialEndsAt: new Date(inDays(-1)),
    });
    expect(trialState(ended, now)).toEqual({ kind: "lapsed" });
    const expired = entitlements({
      plan: "free",
      subscribedPlan: "free",
      status: "expired",
    });
    expect(trialState(expired, now)).toEqual({ kind: "lapsed" });
  });

  it("shows nothing for paid, invited or unknown accounts", () => {
    expect(trialState(entitlements({ status: "active" }), now)).toBeNull();
    expect(
      trialState(entitlements({ plan: "free", status: "active" }), now),
    ).toBeNull();
    expect(trialState(null, now)).toBeNull();
  });
});

describe("pausedGuideIds", () => {
  const guides = [
    { id: "c", createdAt: "2026-03-01T00:00:00Z", status: "active" },
    { id: "a", createdAt: "2026-01-01T00:00:00Z", status: "active" },
    { id: "z", createdAt: "2026-02-01T00:00:00Z", status: "archived" },
    { id: "b", createdAt: "2026-02-01T00:00:00Z", status: "suspended" },
  ];

  it("keeps the oldest guides and pauses the rest", () => {
    expect([...pausedGuideIds(guides, 1)].sort()).toEqual(["b", "c"]);
    expect([...pausedGuideIds(guides, 2)]).toEqual(["c"]);
    expect(pausedGuideIds(guides, 3).size).toBe(0);
  });

  it("ignores archived guides and breaks ties by id", () => {
    const tied = [
      { id: "b2", createdAt: "2026-01-01T00:00:00Z", status: "active" },
      { id: "a1", createdAt: "2026-01-01T00:00:00Z", status: "active" },
    ];
    expect([...pausedGuideIds(tied, 1)]).toEqual(["b2"]);
  });
});
