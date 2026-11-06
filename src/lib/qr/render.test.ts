import { describe, expect, it } from "vitest";

import {
  businessPublicUrl,
  embedCenterMark,
  renderQrPng,
  renderQrSvg,
} from "./render";

describe("businessPublicUrl", () => {
  it("builds the permanent public path", () => {
    expect(businessPublicUrl("casa-brisa")).toMatch(/\/negocio\/casa-brisa$/);
  });
});

describe("embedCenterMark", () => {
  it("places the gold mark in the center of the svg", () => {
    const svg = embedCenterMark(
      '<svg viewBox="0 0 29 29"></svg>',
      "data:image/png;base64,aaaa",
    );
    expect(svg).toContain('href="data:image/png;base64,aaaa"');
    expect(svg).toContain('fill="#ffffff"');
  });
});

describe("renderQr", () => {
  it("returns an svg and a png with the center mark", async () => {
    const url = "https://www.emblematicocr.com/negocio/casa-brisa";
    const svg = await renderQrSvg(url);
    expect(svg).toContain("<svg");
    expect(svg).toContain("data:image/png;base64,");

    const png = await renderQrPng(url);
    expect(png.subarray(0, 4).toString("hex")).toBe("89504e47");
  });
});
