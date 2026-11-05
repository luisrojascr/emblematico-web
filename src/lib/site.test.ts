import { describe, expect, it } from "vitest";

import { SITE, whatsappLink } from "./site";

describe("whatsappLink", () => {
  it("builds a bare wa.me link", () => {
    expect(whatsappLink()).toBe(`https://wa.me/${SITE.whatsappNumber}`);
  });

  it("encodes the prefilled message", () => {
    expect(whatsappLink("Hola, quiero cotizar")).toBe(
      `https://wa.me/${SITE.whatsappNumber}?text=Hola%2C%20quiero%20cotizar`,
    );
  });
});

describe("brand", () => {
  it("keeps the name lowercase", () => {
    expect(SITE.name).toBe(SITE.name.toLowerCase());
  });
});
