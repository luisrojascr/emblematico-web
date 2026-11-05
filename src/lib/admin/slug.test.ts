import { describe, expect, it } from "vitest";

import { slugError, slugifyName, uniqueSlug } from "./slug";

describe("slugifyName", () => {
  it("strips accents and joins words", () => {
    expect(slugifyName("Casa Brisa Arenal")).toBe("casa-brisa-arenal");
    expect(slugifyName("emblemático")).toBe("emblematico");
    expect(slugifyName("  Niño & Café  ")).toBe("nino-cafe");
  });
});

describe("slugError", () => {
  it("rejects short, reserved, and malformed slugs", () => {
    expect(slugError("ab")).toMatch(/3 a 60/);
    expect(slugError("admin")).toBe("Ese slug está reservado.");
    expect(slugError("Casa")).toMatch(/minúsculas/);
    expect(slugError("casa-brisa")).toBeNull();
  });

  it("skips the business reserved list for catalog slugs", () => {
    expect(slugError("admin", { reserved: [] })).toBeNull();
  });
});

describe("uniqueSlug", () => {
  it("appends a numeric suffix when the base is taken or reserved", () => {
    expect(uniqueSlug("Casa Brisa", new Set(["casa-brisa"]))).toBe(
      "casa-brisa-2",
    );
    expect(uniqueSlug("Admin", new Set())).toBe("admin-2");
  });

  it("returns null when the name has no letters or digits", () => {
    expect(uniqueSlug("...", new Set())).toBeNull();
  });

  it("can ignore reserved business words", () => {
    expect(uniqueSlug("Admin", new Set(), { reserved: [] })).toBe("admin");
  });
});
