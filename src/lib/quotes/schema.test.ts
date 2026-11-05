import { describe, expect, it } from "vitest";

import { quoteRequestSchema } from "./schema";

const base = {
  name: "Ana",
  phone: "",
  email: "",
  businessType: "",
  productSlug: "",
  message: "",
};

describe("quoteRequestSchema", () => {
  it("accepts a name with a phone", () => {
    const r = quoteRequestSchema.safeParse({ ...base, phone: "8899 7060" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBeUndefined();
      expect(r.data.message).toBeUndefined();
    }
  });

  it("accepts a name with an email", () => {
    expect(
      quoteRequestSchema.safeParse({ ...base, email: "ana@example.com" })
        .success,
    ).toBe(true);
  });

  it("requires phone or email", () => {
    const r = quoteRequestSchema.safeParse(base);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["phone"]);
  });

  it("requires a name", () => {
    expect(
      quoteRequestSchema.safeParse({ ...base, name: "  ", phone: "1" }).success,
    ).toBe(false);
  });

  it("rejects invalid emails and unknown business types", () => {
    expect(
      quoteRequestSchema.safeParse({ ...base, email: "nope" }).success,
    ).toBe(false);
    expect(
      quoteRequestSchema.safeParse({
        ...base,
        phone: "1",
        businessType: "hacker",
      }).success,
    ).toBe(false);
  });

  it("limits message length", () => {
    expect(
      quoteRequestSchema.safeParse({
        ...base,
        phone: "1",
        message: "x".repeat(2001),
      }).success,
    ).toBe(false);
  });
});
