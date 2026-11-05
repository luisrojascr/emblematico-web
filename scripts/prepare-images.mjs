// One-off: converts the supplied product renders to optimized WebP under public/images.
// Usage: node scripts/prepare-images.mjs <source-dir>
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDir = path.resolve(process.argv[2] ?? "../Images");
const outDir = path.resolve("public/images");

const jobs = [
  ["welcome station.png", "catalog/welcome-station.webp", 1000],
  ["Room essentials.png", "catalog/room-essentials.webp", 1000],
  ["Business QR displays.png", "catalog/business-qr-displays.webp", 1000],
  ["Hospitality kit.png", "catalog/hospitality-kits.webp", 1000],
  ["Soluciones de señalización para hospedaje.png", "overview.webp", 1500],
  ["Emblemático 3D Brand Identity Board.png", "brand-board.webp", 1400],
];

await mkdir(path.join(outDir, "catalog"), { recursive: true });
for (const [src, dest, width] of jobs) {
  const info = await sharp(path.join(sourceDir, src))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(outDir, dest));
  console.log(dest, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`);
}
