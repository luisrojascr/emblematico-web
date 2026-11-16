import { describe, expect, it } from "vitest";

import { composeQuoteMessage, quoteRequestSchema } from "./schema";

const valid = {
  name: "Ana",
  accommodation: "Casa Brisa",
  area: "Guanacaste",
  accommodationType: "Airbnb o anfitrión independiente",
  size: "2 propiedades",
  phone: "8899 7060",
  message: "",
  productSlug: "",
  plan: "",
  billing: "",
  pieces: "",
};

describe("quoteRequestSchema", () => {
  it("accepts a complete request without an optional message", () => {
    const r = quoteRequestSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.message).toBeUndefined();
  });

  it.each(["name", "accommodation", "size", "phone"] as const)(
    "requires %s",
    (field) => {
      expect(
        quoteRequestSchema.safeParse({ ...valid, [field]: "  " }).success,
      ).toBe(false);
    },
  );

  it("rejects unknown areas and accommodation types", () => {
    expect(
      quoteRequestSchema.safeParse({ ...valid, area: "Marte" }).success,
    ).toBe(false);
    expect(
      quoteRequestSchema.safeParse({ ...valid, accommodationType: "hacker" })
        .success,
    ).toBe(false);
  });

  it("limits message length", () => {
    expect(
      quoteRequestSchema.safeParse({ ...valid, message: "x".repeat(1201) })
        .success,
    ).toBe(false);
  });

  it("accepts a known plan and a number of welcome pieces", () => {
    const r = quoteRequestSchema.parse({
      ...valid,
      plan: "managers",
      pieces: "12",
    });
    expect(r.plan).toBe("managers");
    expect(r.pieces).toBe(12);
    const text = composeQuoteMessage(r);
    expect(text).toContain("Plan: Plan para administradores");
    expect(text).toContain("Piezas de bienvenida 3D: 12");
  });

  it("treats an empty plan as undecided and rejects unknown plans", () => {
    const r = quoteRequestSchema.parse(valid);
    expect(r.plan).toBeUndefined();
    expect(r.pieces).toBe(0);
    expect(composeQuoteMessage(r)).toContain("Plan: Aún no lo sé");
    expect(
      quoteRequestSchema.safeParse({ ...valid, plan: "gold" }).success,
    ).toBe(false);
  });

  it("records the billing period for paid plans only", () => {
    const paid = quoteRequestSchema.parse({
      ...valid,
      plan: "essential",
      billing: "monthly",
    });
    expect(composeQuoteMessage(paid)).toContain("Facturación: Mensual");
    const free = quoteRequestSchema.parse({
      ...valid,
      plan: "free",
      billing: "monthly",
    });
    expect(composeQuoteMessage(free)).not.toContain("Facturación");
    expect(
      quoteRequestSchema.safeParse({ ...valid, billing: "weekly" }).success,
    ).toBe(false);
  });

  it("rejects invalid piece quantities", () => {
    for (const pieces of ["-1", "2.5", "abc", "1000"]) {
      expect(quoteRequestSchema.safeParse({ ...valid, pieces }).success).toBe(
        false,
      );
    }
  });

  it("composes extra fields into the message and stays under 2000 chars", () => {
    const r = quoteRequestSchema.parse({ ...valid, message: "x".repeat(1200) });
    const text = composeQuoteMessage(r);
    expect(text).toContain("Alojamiento: Casa Brisa");
    expect(text).toContain("Zona: Guanacaste");
    expect(text.length).toBeLessThanOrEqual(2000);
  });
});
