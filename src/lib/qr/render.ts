import { readFile } from "node:fs/promises";
import path from "node:path";

import QRCode from "qrcode";
import sharp from "sharp";

import { SITE } from "@/lib/site";

const ICON_PATH = path.join(process.cwd(), "public/brand/icon-gold.png");

export function businessPublicUrl(slug: string): string {
  return `${SITE.url.replace(/\/$/, "")}/negocio/${slug}`;
}

const QR_OPTIONS = {
  errorCorrectionLevel: "H",
  margin: 2,
  color: { dark: "#1F1F1F", light: "#FFFFFF" },
} as const;

/** Covers the center modules with a white plate and the gold mark. Level H tolerates it. */
export function embedCenterMark(svg: string, dataUri: string): string {
  const viewBox = svg.match(/viewBox="0 0 ([0-9.]+) ([0-9.]+)"/);
  if (!viewBox?.[1] || !viewBox[2]) return svg;
  const width = Number(viewBox[1]);
  const height = Number(viewBox[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0)
    return svg;
  const mark = Math.min(width, height) * 0.22;
  const pad = mark * 0.14;
  const plate = mark + pad * 2;
  const plateX = (width - plate) / 2;
  const plateY = (height - plate) / 2;
  const markX = (width - mark) / 2;
  const markY = (height - mark) / 2;
  const overlay =
    `<rect x="${plateX}" y="${plateY}" width="${plate}" height="${plate}" rx="${plate * 0.18}" fill="#ffffff"/>` +
    `<image href="${dataUri}" x="${markX}" y="${markY}" width="${mark}" height="${mark}"/>`;
  return svg.replace("</svg>", `${overlay}</svg>`);
}

async function iconDataUri(): Promise<string> {
  const bytes = await readFile(ICON_PATH);
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

export async function renderQrSvg(url: string): Promise<string> {
  const svg = await QRCode.toString(url, { ...QR_OPTIONS, type: "svg" });
  return embedCenterMark(svg, await iconDataUri());
}

export async function renderQrPng(url: string): Promise<Buffer> {
  const size = 1024;
  const qr = await QRCode.toBuffer(url, {
    ...QR_OPTIONS,
    type: "png",
    width: size,
  });
  const mark = Math.round(size * 0.22);
  const pad = Math.round(mark * 0.14);
  const plate = mark + pad * 2;
  const icon = await sharp(ICON_PATH).resize(mark, mark).png().toBuffer();
  const platePng = await sharp({
    create: {
      width: plate,
      height: plate,
      channels: 4,
      background: "#ffffff",
    },
  })
    .png()
    .toBuffer();
  const plateLeft = Math.round((size - plate) / 2);
  const iconLeft = Math.round((size - mark) / 2);
  return sharp(qr)
    .composite([
      { input: platePng, left: plateLeft, top: plateLeft },
      { input: icon, left: iconLeft, top: iconLeft },
    ])
    .png()
    .toBuffer();
}
