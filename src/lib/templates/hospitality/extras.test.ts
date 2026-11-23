import { describe, expect, it } from "vitest";

import { sourceFields } from "@/lib/translations/hospitality";

import { telHref } from "../common";
import { hospitalityContentSchema } from "./schema";

const base = hospitalityContentSchema.parse({});

describe("optional guide services", () => {
  it("are off and empty in a guide saved before they existed", () => {
    for (const key of [
      "tours",
      "wellness",
      "shopping",
      "emergency",
      "cleaning",
      "minibar",
      "taxi",
      "parking",
      "faq",
    ] as const) {
      expect(base[key].enabled).toBe(false);
    }
    expect(base.faq.items).toEqual([]);
    expect(base.cleaning.message).toBe("");
  });

  it("rejects a link that is not https", () => {
    const result = hospitalityContentSchema.safeParse({
      taxi: {
        enabled: true,
        items: [{ name: "Taxi Uno", phone: "2222 3333", url: "http://x.cr" }],
      },
    });
    expect(result.success).toBe(false);
  });

  it("keeps phones and prices exactly as typed", () => {
    const parsed = hospitalityContentSchema.parse({
      emergency: {
        enabled: true,
        items: [{ name: "Cruz Roja", phone: "+506 2221 5818" }],
      },
      minibar: { enabled: true, items: [{ name: "Cerveza", price: "₡1.500" }] },
    });
    expect(parsed.emergency.items[0]!.phone).toBe("+506 2221 5818");
    expect(parsed.minibar.items[0]!.price).toBe("₡1.500");
  });

  it("translates names and answers but not phones, prices or links", () => {
    const content = hospitalityContentSchema.parse({
      emergency: {
        enabled: true,
        items: [{ name: "Hospital", phone: "911", detail: "A 5 minutos" }],
      },
      minibar: { enabled: true, items: [{ name: "Agua", price: "$2" }] },
      faq: {
        enabled: true,
        items: [{ question: "¿Hay parqueo?", answer: "Sí, gratis." }],
      },
    });
    const paths = sourceFields(content).map((f) => f.path);
    expect(paths).toContain("emergency.items.0.detail");
    expect(paths).toContain("minibar.items.0.name");
    expect(paths).toContain("faq.items.0.answer");
    expect(paths.some((p) => p.endsWith(".phone") || p.endsWith(".price"))).toBe(
      false,
    );
  });

  it("builds a dialable tel link from a typed phone", () => {
    expect(telHref("2222 3333")).toBe("tel:22223333");
    expect(telHref("+506 2221-5818")).toBe("tel:+50622215818");
  });
});
