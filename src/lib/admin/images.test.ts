import { describe, expect, it } from "vitest";

import { isStoredCatalogImage, sniffImage } from "./images";

describe("sniffImage", () => {
  it("recognizes jpeg, png, and webp", () => {
    const jpeg = new Uint8Array(16);
    jpeg.set([0xff, 0xd8, 0xff, 0xe0], 0);
    expect(sniffImage(jpeg)).toBe("jpg");

    const png = new Uint8Array(16);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    expect(sniffImage(png)).toBe("png");

    const webp = new Uint8Array(16);
    webp.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50], 0);
    expect(sniffImage(webp)).toBe("webp");
  });

  it("rejects other files and oversized buffers", () => {
    expect(
      sniffImage(
        new Uint8Array([0x3c, 0x73, 0x76, 0x67, 0, 0, 0, 0, 0, 0, 0, 0]),
      ),
    ).toBeNull();
    expect(sniffImage(new Uint8Array(5 * 1024 * 1024 + 1))).toBeNull();
  });
});

describe("isStoredCatalogImage", () => {
  it("allows seed paths and uploaded product paths only", () => {
    expect(isStoredCatalogImage("/images/catalog/welcome-station.webp")).toBe(
      true,
    );
    expect(
      isStoredCatalogImage("products/11111111-1111-4111-8111-111111111111.png"),
    ).toBe(true);
    expect(isStoredCatalogImage("https://evil.example/a.png")).toBe(false);
    expect(isStoredCatalogImage("/negocio/casa-brisa")).toBe(false);
  });
});
