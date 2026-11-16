import { describe, expect, it } from "vitest";

import { detectPlan } from "./subscription";

describe("detectPlan", () => {
  it("usa el plan escrito por el admin", () => {
    expect(detectPlan(["Hospitality Plus"], 1).id).toBe("plus");
    expect(detectPlan([null, "essential anual"], null).id).toBe("essential");
  });
  it("si no hay texto, usa el límite de alojamientos", () => {
    expect(detectPlan([], null).id).toBe("free");
    expect(detectPlan([null], 3).id).toBe("essential");
    expect(detectPlan([], 5).id).toBe("plus");
    expect(detectPlan([], 8).id).toBe("plus");
    expect(detectPlan([], 11).id).toBe("managers");
  });
});
