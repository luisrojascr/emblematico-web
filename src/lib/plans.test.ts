import { describe, expect, it } from "vitest";

import {
  MAX_SELF_SERVE_PROPERTIES,
  PLANS,
  annualSavings,
  firstChargeTotal,
  firstYearTotal,
  maxAnnualSavingsPercent,
  parseBilling,
  formatUsd,
  getPlan,
  pieceUnitPrice,
  piecesTotal,
} from "./plans";

describe("PLANS", () => {
  it("lists free, essential, plus and managers in that order", () => {
    expect(PLANS.map((p) => p.id)).toEqual([
      "free",
      "essential",
      "plus",
      "managers",
    ]);
  });

  it("prices the digital plans in USD per year", () => {
    expect(getPlan("free")?.price).toBe(0);
    expect(getPlan("essential")?.price).toBe(49);
    expect(getPlan("plus")?.price).toBe(99);
    expect(getPlan("managers")?.price).toBeNull();
  });

  it("limits properties and prices extra properties", () => {
    expect(getPlan("free")).toMatchObject({ properties: 1 });
    expect(getPlan("free")?.extraProperty).toBeUndefined();
    expect(getPlan("essential")).toMatchObject({
      properties: 3,
      extraProperty: 15,
    });
    expect(getPlan("plus")).toMatchObject({ properties: 5 });
    expect(getPlan("plus")?.extraProperty).toBeUndefined();
    expect(MAX_SELF_SERVE_PROPERTIES).toBe(5);
    expect(getPlan("managers")?.includes[0]).toBe("Más de 5 alojamientos");
  });

  it("does not include the 3D piece in the self-serve plans", () => {
    for (const plan of PLANS.filter((p) => p.id !== "managers")) {
      expect(plan.includes.join(" ")).not.toMatch(/3D|piezas? f[ií]sicas?/i);
    }
  });

  it("prices monthly billing and computes what annual saves", () => {
    expect(getPlan("essential")?.monthlyPrice).toBe(6);
    expect(getPlan("essential")?.extraPropertyMonthly).toBe(1.5);
    expect(getPlan("plus")?.monthlyPrice).toBe(12);
    expect(getPlan("free")?.monthlyPrice).toBeUndefined();
    expect(getPlan("managers")?.monthlyPrice).toBeUndefined();
    expect(annualSavings(getPlan("essential")!)).toBe(23);
    expect(annualSavings(getPlan("plus")!)).toBe(45);
    expect(annualSavings(getPlan("free")!)).toBeNull();
    expect(maxAnnualSavingsPercent()).toBe(32);
  });

  it("charges the first month plus pieces on monthly billing", () => {
    const essential = getPlan("essential")!;
    expect(firstChargeTotal(essential, 2, "monthly")).toBe(6 + 70);
    expect(firstChargeTotal(essential, 2, "annual")).toBe(49 + 70);
    expect(firstChargeTotal(essential, 11, "monthly")).toBeNull();
  });

  it("parses billing periods", () => {
    expect(parseBilling("monthly")).toBe("monthly");
    expect(parseBilling("weekly")).toBeUndefined();
  });

  it("highlights only Plus", () => {
    expect(PLANS.filter((p) => p.highlighted).map((p) => p.id)).toEqual([
      "plus",
    ]);
  });

  it("returns undefined for unknown plans", () => {
    expect(getPlan("gold")).toBeUndefined();
    expect(getPlan(undefined)).toBeUndefined();
  });
});

describe("welcome piece pricing", () => {
  it("uses volume tiers", () => {
    expect(pieceUnitPrice(1)).toBe(35);
    expect(pieceUnitPrice(2)).toBe(35);
    expect(pieceUnitPrice(3)).toBe(31);
    expect(pieceUnitPrice(5)).toBe(31);
    expect(pieceUnitPrice(6)).toBe(28);
    expect(pieceUnitPrice(10)).toBe(28);
    expect(pieceUnitPrice(11)).toBeNull();
  });

  it("totals pieces and quotes beyond the last tier", () => {
    expect(piecesTotal(0)).toBe(0);
    expect(piecesTotal(3)).toBe(93);
    expect(piecesTotal(11)).toBeNull();
  });

  it("adds pieces once to the first-year total", () => {
    const free = getPlan("free")!;
    const plus = getPlan("plus")!;
    expect(firstYearTotal(free, 1)).toBe(35);
    expect(firstYearTotal(plus, 0)).toBe(99);
    expect(firstYearTotal(plus, 5)).toBe(99 + 5 * 31);
    expect(firstYearTotal(plus, 11)).toBeNull();
    expect(firstYearTotal(getPlan("managers")!, 1)).toBeNull();
  });

  it("formats dollars", () => {
    expect(formatUsd(1234)).toBe("$1,234");
  });
});
