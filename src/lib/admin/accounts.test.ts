import { describe, expect, it } from "vitest";

import {
  accountFilter,
  accountState,
  dateInputValue,
  defaultPeriodEnd,
  extendedTrialEnd,
  manualSubscription,
  matchesAccount,
  propertyLimitFor,
  setPlanSchema,
  type SubscriptionRow,
} from "./accounts";

const now = new Date("2026-11-18T18:00:00Z");
const inDays = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

function sub(patch: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    plan: "essential",
    status: "trialing",
    billing_period: null,
    trial_ends_at: inDays(20),
    current_period_end: null,
    extra_properties: 0,
    property_limit_override: null,
    ...patch,
  };
}

describe("accountState", () => {
  it("describes trials and their end", () => {
    expect(accountState(sub(), now)).toMatchObject({
      label: "En prueba: quedan 20 días",
      tone: "trial",
      effectivePlan: "essential",
    });
    expect(accountState(sub({ trial_ends_at: inDays(3) }), now).tone).toBe(
      "warn",
    );
    expect(
      accountState(sub({ trial_ends_at: inDays(-1) }), now).effectivePlan,
    ).toBe("free");
  });

  it("follows effective_plan for paid plans, grace and Free", () => {
    const paid = sub({
      status: "active",
      plan: "plus",
      current_period_end: inDays(100),
    });
    expect(accountState(paid, now).effectivePlan).toBe("plus");
    const grace = sub({
      status: "active",
      plan: "plus",
      current_period_end: inDays(-3),
    });
    expect(accountState(grace, now)).toMatchObject({
      tone: "warn",
      effectivePlan: "plus",
    });
    const lapsed = sub({
      status: "active",
      plan: "plus",
      current_period_end: inDays(-8),
    });
    expect(accountState(lapsed, now).effectivePlan).toBe("free");
    expect(
      accountState(sub({ status: "expired", plan: "free" }), now).label,
    ).toBe("Free (venció)");
    expect(accountState(null, now).effectivePlan).toBe("free");
  });
});

describe("propertyLimitFor", () => {
  it("matches property_limit()", () => {
    expect(propertyLimitFor("free", sub({ extra_properties: 5 }))).toBe(1);
    expect(propertyLimitFor("essential", sub())).toBe(3);
    expect(propertyLimitFor("essential", sub({ extra_properties: 10 }))).toBe(
      7,
    );
    expect(propertyLimitFor("plus", sub({ extra_properties: 10 }))).toBe(17);
    expect(
      propertyLimitFor("managers", sub({ property_limit_override: 40 })),
    ).toBe(40);
    expect(propertyLimitFor("managers", null)).toBe(1000);
  });
});

describe("manual plan changes", () => {
  it("defaults the expiry to one year or one month", () => {
    const from = new Date("2026-11-18T12:00:00Z");
    expect(defaultPeriodEnd("annual", from).toISOString()).toBe(
      "2027-11-18T12:00:00.000Z",
    );
    expect(defaultPeriodEnd("monthly", from).toISOString()).toBe(
      "2026-12-18T12:00:00.000Z",
    );
  });

  it("validates the form and builds the subscription", () => {
    const base = {
      userId: "6f1f7d1e-2a3b-4c5d-8e9f-0a1b2c3d4e5f",
      period: "annual",
      periodEnd: "2027-11-18",
      extraProperties: "2",
      limitOverride: null,
      note: "",
    };
    const parsed = setPlanSchema.parse({ ...base, plan: "essential" });
    const row = manualSubscription(parsed);
    expect(row).toMatchObject({
      plan: "essential",
      status: "active",
      billing_period: "annual",
      extra_properties: 2,
      property_limit_override: null,
    });
    expect(row.current_period_end).toBe("2027-11-19T05:59:59.000Z");

    expect(
      setPlanSchema.safeParse({ ...base, plan: "plus", periodEnd: null })
        .success,
    ).toBe(false);
    const free = manualSubscription(
      setPlanSchema.parse({
        ...base,
        plan: "free",
        period: null,
        periodEnd: null,
      }),
    );
    expect(free).toMatchObject({
      plan: "free",
      billing_period: null,
      current_period_end: null,
      extra_properties: 0,
    });
  });

  it("round-trips a stored expiry as the same Costa Rica day", () => {
    const stored = manualSubscription(
      setPlanSchema.parse({
        userId: "6f1f7d1e-2a3b-4c5d-8e9f-0a1b2c3d4e5f",
        plan: "plus",
        period: "annual",
        periodEnd: "2027-11-18",
        extraProperties: 0,
        limitOverride: null,
        note: "",
      }),
    ).current_period_end!;
    expect(dateInputValue(new Date(stored))).toBe("2027-11-18");
    // 8 PM in Costa Rica is already the next day in UTC.
    expect(dateInputValue(new Date("2026-11-19T02:00:00Z"))).toBe("2026-11-18");
  });

  it("extends a running trial from its end and restarts a lapsed one", () => {
    expect(extendedTrialEnd(inDays(5), 7, now).toISOString()).toBe(inDays(12));
    expect(extendedTrialEnd(inDays(-5), 7, now).toISOString()).toBe(inDays(7));
    expect(extendedTrialEnd(null, 30, now).toISOString()).toBe(inDays(30));
  });
});

describe("account filters", () => {
  const account = (
    patch: Partial<SubscriptionRow> | null,
    blocked = false,
  ) => ({
    email: "ana@example.com",
    fullName: "Ana Mora",
    role: "client" as const,
    blocked,
    sub: patch === null ? null : sub(patch),
  });

  it("filters by state and searches name or email", () => {
    expect(matchesAccount(account({}), "prueba", "", now)).toBe(true);
    expect(
      matchesAccount(account({ trial_ends_at: inDays(3) }), "vence", "", now),
    ).toBe(true);
    expect(matchesAccount(account({}), "vence", "", now)).toBe(false);
    expect(
      matchesAccount(
        account({ status: "active", current_period_end: inDays(200) }),
        "pago",
        "",
        now,
      ),
    ).toBe(true);
    expect(matchesAccount(account(null), "free", "", now)).toBe(true);
    expect(matchesAccount(account({}, true), "bloqueadas", "", now)).toBe(true);
    expect(matchesAccount(account({}), "todas", "MORA", now)).toBe(true);
    expect(matchesAccount(account({}), "todas", "pedro", now)).toBe(false);
    expect(accountFilter("nope")).toBe("todas");
  });
});
