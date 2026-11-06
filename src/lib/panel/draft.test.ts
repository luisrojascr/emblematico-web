import { describe, expect, it } from "vitest";

import { defaultContent } from "@/lib/templates/registry";

import { businessImagePath, draftForBusiness, ownsMediaPath } from "./draft";

const BUSINESS = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

describe("ownsMediaPath", () => {
  it("accepts an empty path and a file in this business folder", () => {
    const path = businessImagePath(BUSINESS, "jpg");
    expect(ownsMediaPath(BUSINESS, null)).toBe(true);
    expect(ownsMediaPath(BUSINESS, undefined)).toBe(true);
    expect(ownsMediaPath(BUSINESS, path)).toBe(true);
  });

  it("rejects another business folder and a catalog path", () => {
    expect(ownsMediaPath(BUSINESS, businessImagePath(OTHER, "png"))).toBe(
      false,
    );
    expect(
      ownsMediaPath(
        BUSINESS,
        "products/33333333-3333-4333-8333-333333333333.webp",
      ),
    ).toBe(false);
  });
});

describe("draftForBusiness", () => {
  it("keeps a logo that belongs to the business", () => {
    const logo = businessImagePath(BUSINESS, "webp");
    const raw = {
      ...defaultContent("hospitality").content,
      theme: { accent: "#C9AC87", logo_path: logo },
    };
    const result = draftForBusiness("hospitality", raw, BUSINESS);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.page.content.theme.logo_path).toBe(logo);
  });

  it("rejects a logo stored under another business", () => {
    const raw = {
      ...defaultContent("general").content,
      theme: {
        accent: "#C9AC87",
        cover_path: businessImagePath(OTHER, "jpg"),
      },
    };
    const result = draftForBusiness("general", raw, BUSINESS);
    expect(result).toEqual({
      ok: false,
      message: "La imagen no pertenece a este negocio.",
    });
  });

  it("turns a blank image path into no image", () => {
    const raw = {
      ...defaultContent("hospitality").content,
      theme: { accent: "#112233", logo_path: "" },
    };
    const result = draftForBusiness("hospitality", raw, BUSINESS);
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.page.content.theme.logo_path ?? null).toBeNull();
  });
});
