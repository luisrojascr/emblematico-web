import "server-only";

import { imageMime, sniffImage } from "@/lib/admin/images";

import {
  isListingImageHost,
  listingSource,
  parseListing,
  type ListingData,
} from "./listing-parse";

/**
 * Lee la página pública de un anuncio para prellenar el asistente.
 * Solo se visitan hosts de Airbnb/Booking (y sus CDN de fotos), por HTTPS, sin
 * seguir redirecciones a otros hosts, con límite de tamaño y de tiempo.
 * Los términos de Airbnb prohíben extraer datos de forma automática: esta
 * función solo se usa cuando la persona pega su propio enlace y confirma que el
 * contenido es suyo. Si el sitio bloquea la lectura, el asistente sigue a mano.
 */

const USER_AGENT =
  "Mozilla/5.0 (compatible; EmblematicoBot/1.0; +https://www.emblematicocr.com)";
const MAX_HTML = 3_000_000;
const MAX_IMAGE = 4_000_000;
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

async function readLimited(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

async function safeFetch(
  start: URL,
  allowed: (url: URL) => boolean,
  headers: Record<string, string>,
  maxBytes: number,
): Promise<{ bytes: Uint8Array; finalUrl: URL } | null> {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (url.protocol !== "https:" || !allowed(url)) return null;
    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        headers: { "User-Agent": USER_AGENT, ...headers },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
    } catch {
      return null;
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return null;
      try {
        url = new URL(location, url);
      } catch {
        return null;
      }
      continue;
    }
    if (!response.ok) return null;
    const bytes = await readLimited(response, maxBytes);
    return bytes ? { bytes, finalUrl: url } : null;
  }
  return null;
}

export type ListingImport =
  | { ok: true; data: ListingData; photo: string | null }
  | { ok: false; message: string };

export async function importListing(rawUrl: string): Promise<ListingImport> {
  const target = listingSource(rawUrl);
  if (!target) {
    return {
      ok: false,
      message:
        "Ese enlace no parece un anuncio de Airbnb o Booking. Pega la dirección completa del anuncio, que empieza con https://.",
    };
  }
  const page = await safeFetch(
    target.url,
    (url) => listingSource(url.toString())?.source === target.source,
    { Accept: "text/html", "Accept-Language": "es-CR,es;q=0.9,en;q=0.5" },
    MAX_HTML,
  );
  const data = page
    ? parseListing(new TextDecoder().decode(page.bytes), target.source)
    : null;
  if (!data) {
    return {
      ok: false,
      message:
        "No pudimos leer ese anuncio (el sitio puede bloquear la lectura automática). Puedes llenar los pasos a mano o pegar la descripción.",
    };
  }

  let photo: string | null = null;
  if (data.imageUrl) {
    const image = await safeFetch(
      new URL(data.imageUrl),
      (url) => isListingImageHost(url.hostname),
      { Accept: "image/webp,image/jpeg,image/png" },
      MAX_IMAGE,
    );
    const kind = image ? sniffImage(image.bytes) : null;
    if (image && kind) {
      photo = `data:${imageMime(kind)};base64,${Buffer.from(image.bytes).toString("base64")}`;
    }
  }
  return { ok: true, data, photo };
}
