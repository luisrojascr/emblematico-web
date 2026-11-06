const MAX_BYTES = 5 * 1024 * 1024;

export type ImageKind = "jpg" | "png" | "webp";

const MIME: Record<ImageKind, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function imageMime(kind: ImageKind): string {
  return MIME[kind];
}

/** Detect jpeg, png, or webp from the file bytes. The client-supplied type is ignored. */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  if (bytes.length < 12 || bytes.length > MAX_BYTES) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  const riff = String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!);
  const webp = String.fromCharCode(
    bytes[8]!,
    bytes[9]!,
    bytes[10]!,
    bytes[11]!,
  );
  if (riff === "RIFF" && webp === "WEBP") return "webp";
  return null;
}

/** Catalog files live in the public bucket, outside any business folder. */
export function catalogImagePath(kind: ImageKind): string {
  return `products/${crypto.randomUUID()}.${kind}`;
}

const STORED_IMAGE =
  /^(?:\/images\/[a-z0-9][a-z0-9./_-]*|products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp))$/;

export function isStoredCatalogImage(path: string): boolean {
  return STORED_IMAGE.test(path);
}
