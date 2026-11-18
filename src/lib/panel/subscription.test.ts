import { describe, expect, it } from "vitest";

import { planFromText, showsBranding } from "./subscription";

describe("planFromText", () => {
  it("reads the plan an admin wrote", () => {
    expect(planFromText("Hospitality Plus")?.id).toBe("plus");
    expect(planFromText("essential anual")?.id).toBe("essential");
    expect(planFromText("Plan para administradores")?.id).toBe("managers");
    expect(planFromText("")).toBeUndefined();
  });
});

describe("showsBranding", () => {
  it("removes the branding only on paid plans", () => {
    expect(showsBranding("Hospitality Essential")).toBe(false);
    expect(showsBranding("Plus mensual")).toBe(false);
    expect(showsBranding("Plan para administradores")).toBe(false);
    expect(showsBranding("Hospitality Free")).toBe(true);
    expect(showsBranding(null)).toBe(true);
    expect(showsBranding("Plan anual 2025")).toBe(true);
  });
});
