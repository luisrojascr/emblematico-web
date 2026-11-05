import { describe, expect, it } from "vitest";

import {
  actionUrl,
  hexColor,
  httpsUrl,
  mediaPath,
  whatsappHref,
  whatsappPhone,
} from "./common";
import { generalContentSchema } from "./general/schema";
import { hospitalityContentSchema } from "./hospitality/schema";
import { defaultContent, parsePageContent } from "./registry";
import { contrastRatio, readableOn } from "./ui";

describe("httpsUrl", () => {
  it.each(["https://example.com", "https://maps.google.com/?q=a b", ""])(
    "accepts %j",
    (v) => expect(httpsUrl.safeParse(v).success).toBe(true),
  );
  it.each([
    "http://example.com",
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>",
    "ftp://example.com",
    "//example.com",
    "example.com",
    "https://user:pass@example.com",
    `https://example.com/${"a".repeat(500)}`,
  ])("rejects %j", (v) => expect(httpsUrl.safeParse(v).success).toBe(false));
});

describe("actionUrl", () => {
  it.each(["https://wa.me/50688997060", "tel:+50688997060", "tel:88997060"])(
    "accepts %j",
    (v) => expect(actionUrl.safeParse(v).success).toBe(true),
  );
  it.each(["javascript:alert(1)", "tel:abc", "mailto:a@b.com", "http://x.com"])(
    "rejects %j",
    (v) => expect(actionUrl.safeParse(v).success).toBe(false),
  );
});

describe("whatsappPhone", () => {
  it("normalizes formatting and adds 506 to 8-digit numbers", () => {
    expect(whatsappPhone.parse("8899 7060")).toBe("50688997060");
    expect(whatsappPhone.parse("+506 8899-7060")).toBe("50688997060");
  });
  it("allows blank and rejects nonsense", () => {
    expect(whatsappPhone.parse("")).toBe("");
    expect(whatsappPhone.safeParse("12345").success).toBe(false);
  });
  it("builds an encoded link", () => {
    expect(whatsappHref("50688997060", "Hola & gracias")).toBe(
      "https://wa.me/50688997060?text=Hola%20%26%20gracias",
    );
  });
});

describe("theme helpers", () => {
  it("validates hex colors", () => {
    expect(hexColor.safeParse("#C9AC87").success).toBe(true);
    expect(hexColor.safeParse("red").success).toBe(false);
    expect(hexColor.safeParse("#fff").success).toBe(false);
  });
  it("only allows media paths from the bucket layout", () => {
    const id = "0b9e5a54-6f43-4c63-9c1f-1c2d3e4f5a6b";
    expect(mediaPath.safeParse(`${id}/${id}.webp`).success).toBe(true);
    expect(mediaPath.safeParse("https://evil.com/x.png").success).toBe(false);
    expect(mediaPath.safeParse(`${id}/../x.png`).success).toBe(false);
  });
  it("picks readable text color", () => {
    expect(readableOn("#1F1F1F")).toBe("#FFFFFF");
    expect(readableOn("#F6EFE6")).toBe("#1F1F1F");
  });
  it("chooses the higher-contrast text color for mid-tones", () => {
    expect(contrastRatio("#888888", "#FFFFFF")).toBeCloseTo(3.54, 1);
    expect(contrastRatio("#888888", "#1F1F1F")).toBeCloseTo(4.65, 1);
    expect(readableOn("#888888")).toBe("#1F1F1F");
    expect(readableOn("#C9AC87")).toBe("#1F1F1F");
    for (const hex of ["#777777", "#666666", "#0000FF", "#FF0000", "#00AA00"]) {
      const chosen = readableOn(hex);
      const other = chosen === "#1F1F1F" ? "#FFFFFF" : "#1F1F1F";
      expect(contrastRatio(hex, chosen)).toBeGreaterThanOrEqual(
        contrastRatio(hex, other),
      );
    }
  });
});

describe("hospitality schema", () => {
  it("fills disabled defaults from an empty object", () => {
    const c = hospitalityContentSchema.parse({});
    expect(c.schema_version).toBe(1);
    expect(c.wifi.enabled).toBe(false);
    expect(c.theme.accent).toBe("#C9AC87");
  });

  it("strips unknown keys", () => {
    const c = hospitalityContentSchema.parse({
      evil: "<script>",
      wifi: { enabled: true, network: "x", injected: 1 },
    });
    expect("evil" in c).toBe(false);
    expect("injected" in c.wifi).toBe(false);
  });

  it("rejects oversized text and too many items", () => {
    expect(
      hospitalityContentSchema.safeParse({ tagline: "a".repeat(141) }).success,
    ).toBe(false);
    expect(
      hospitalityContentSchema.safeParse({
        rules: { enabled: true, items: Array(16).fill("x") },
      }).success,
    ).toBe(false);
  });

  it("rejects unsafe recommendation URLs", () => {
    const result = hospitalityContentSchema.safeParse({
      recommendations: {
        enabled: true,
        items: [{ name: "Sitio", url: "javascript:alert(1)" }],
      },
    });
    expect(result.success).toBe(false);
  });

  it("keeps Wi-Fi credentials exactly as typed, including edge spaces", () => {
    const c = hospitalityContentSchema.parse({
      wifi: {
        enabled: true,
        network: " Casa Brisa ",
        password: "  pass word  ",
      },
    });
    expect(c.wifi.network).toBe(" Casa Brisa ");
    expect(c.wifi.password).toBe("  pass word  ");
    expect(
      hospitalityContentSchema.safeParse({ wifi: { password: "a".repeat(81) } })
        .success,
    ).toBe(false);
  });

  it("rejects an unknown schema version", () => {
    expect(
      hospitalityContentSchema.safeParse({ schema_version: 2 }).success,
    ).toBe(false);
  });
});

describe("general schema", () => {
  it("accepts a full valid page", () => {
    const result = generalContentSchema.safeParse({
      cta: { enabled: true, label: "Reservar", url: "https://example.com" },
      location: {
        enabled: true,
        address: "San José",
        maps_url: "https://maps.example.com",
      },
      social: {
        enabled: true,
        links: [{ label: "Instagram", url: "https://instagram.com/x" }],
      },
      whatsapp: { enabled: true, phone: "8899 7060", message: "Hola" },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.whatsapp.phone).toBe("50688997060");
  });

  it("rejects bad CTA and social URLs", () => {
    expect(
      generalContentSchema.safeParse({
        cta: { enabled: true, label: "x", url: "javascript:alert(1)" },
      }).success,
    ).toBe(false);
    expect(
      generalContentSchema.safeParse({
        social: { enabled: true, links: [{ label: "x", url: "" }] },
      }).success,
    ).toBe(false);
  });

  it("limits description length", () => {
    expect(
      generalContentSchema.safeParse({
        description: { enabled: true, body: "a".repeat(1501) },
      }).success,
    ).toBe(false);
  });
});

describe("registry", () => {
  it("returns valid defaults for every template", () => {
    expect(defaultContent("hospitality").templateKey).toBe("hospitality");
    expect(defaultContent("general").templateKey).toBe("general");
  });

  it("returns null for invalid stored content", () => {
    expect(parsePageContent("general", { tagline: 123 })).toBeNull();
  });

  it("treats null content as empty defaults", () => {
    expect(parsePageContent("hospitality", null)).not.toBeNull();
  });
});
