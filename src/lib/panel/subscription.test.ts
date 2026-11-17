import { describe, expect, it } from "vitest";

import { detectPlan, showsBranding } from "./subscription";

describe("detectPlan", () => {
  it("usa el plan escrito por el admin", () => {
    expect(detectPlan(["Hospitality Plus"], 1).id).toBe("plus");
    expect(detectPlan([null, "essential anual"], null).id).toBe("essential");
  });
  it("si no hay texto, usa el límite de alojamientos sin suponer un plan mayor", () => {
    expect(detectPlan([], null).id).toBe("free");
    expect(detectPlan([], 1).id).toBe("free");
    expect(detectPlan([null], 3).id).toBe("essential");
    // Essential con adicionales llega a 7: no se confunde con Plus.
    expect(detectPlan([], 5).id).toBe("essential");
    expect(detectPlan([], 6).id).toBe("essential");
    expect(detectPlan([], 7).id).toBe("essential");
    // Más de 7 solo cabe en Plus (o administradores, que se escribe a mano).
    expect(detectPlan([], 8).id).toBe("plus");
    expect(detectPlan([], 25).id).toBe("plus");
  });
  it("el texto del admin gana sobre el límite", () => {
    expect(detectPlan(["Hospitality Plus"], 7).id).toBe("plus");
    expect(detectPlan(["Plan para administradores"], 7).id).toBe("managers");
  });
});

describe("showsBranding", () => {
  it("quita la marca solo en planes de pago", () => {
    expect(showsBranding("Hospitality Essential")).toBe(false);
    expect(showsBranding("Plus mensual")).toBe(false);
    expect(showsBranding("Plan para administradores")).toBe(false);
    expect(showsBranding("Hospitality Free")).toBe(true);
    expect(showsBranding(null)).toBe(true);
    expect(showsBranding("Plan anual 2025")).toBe(true);
  });
});
