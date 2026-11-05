// One-off: trims transparent padding from the supplied brand PNGs and derives
// a cream wordmark/icon for dark (#1F1F1F) backgrounds, plus favicon and app icon.
// Usage: node scripts/prepare-brand.mjs <source-dir>
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDir = path.resolve(process.argv[2] ?? "..");
const outDir = path.resolve("public/brand");
const appDir = path.resolve("src/app");
const CREAM = { r: 0xf6, g: 0xef, b: 0xe6 };

const sources = {
  "logo-gold": "main-logo.png",
  "logo-black": "logo-black-version.png",
  "icon-gold": "main-icon.png",
  "icon-black": "icon-black-version.png",
};

async function trimmed(file) {
  return sharp(path.join(sourceDir, file))
    .trim({ threshold: 1 })
    .png()
    .toBuffer();
}

// Flat recolor: keep alpha, replace every pixel color.
async function recolor(buffer, { r, g, b }) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

async function squareIcon(buffer, size, background) {
  const inner = Math.round(size * 0.68);
  const icon = await sharp(buffer)
    .resize(inner, inner, { fit: "inside" })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: icon, gravity: "center" }])
    .png()
    .toBuffer();
}

await mkdir(outDir, { recursive: true });

const buffers = {};
for (const [name, file] of Object.entries(sources)) {
  buffers[name] = await trimmed(file);
  await sharp(buffers[name]).toFile(path.join(outDir, `${name}.png`));
}

// Cream variants for dark sections.
const logoCream = await recolor(buffers["logo-black"], CREAM);
const iconCream = await recolor(buffers["icon-black"], CREAM);
await sharp(logoCream).toFile(path.join(outDir, "logo-cream.png"));
await sharp(iconCream).toFile(path.join(outDir, "icon-cream.png"));

// Favicon / app icons (gold arch on cream).
const cream = { ...CREAM, alpha: 1 };
await sharp(await squareIcon(buffers["icon-gold"], 512, cream)).toFile(
  path.join(appDir, "icon.png"),
);
await sharp(await squareIcon(buffers["icon-gold"], 180, cream)).toFile(
  path.join(appDir, "apple-icon.png"),
);

console.log("Brand assets written to", outDir);
