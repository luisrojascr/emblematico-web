import { toTime24 } from "@/lib/templates/time";

/**
 * Lectura de la página pública de un anuncio (Airbnb o Booking) para prellenar
 * el asistente. Todo es "mejor esfuerzo": cualquier dato puede faltar.
 * Este archivo es puro (sin red) para poder probarlo con HTML de ejemplo.
 */

export type ListingSource = "airbnb" | "booking";

export type ListingData = {
  source: ListingSource;
  name: string;
  description: string;
  amenities: string[];
  checkIn: string;
  checkOut: string;
  rules: string[];
  /** https de la foto principal (se descarga aparte). */
  imageUrl: string | null;
};

const AIRBNB_HOST = /^(?:www\.|[a-z]{2}\.)?airbnb\.[a-z]{2,3}(?:\.[a-z]{2})?$/i;
const BOOKING_HOST = /^(?:www\.)?booking\.com$/i;

/** Valida el enlace pegado y devuelve la dirección canónica (sin parámetros). */
export function listingSource(
  raw: string,
): { url: URL; source: ListingSource } | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (url.port && url.port !== "443") return null;
  const host = url.hostname;
  if (AIRBNB_HOST.test(host)) {
    const match = /^\/(rooms\/\d+|h\/[A-Za-z0-9_-]+)/.exec(url.pathname);
    if (!match) return null;
    return {
      url: new URL(`https://${host}/${match[1]}`),
      source: "airbnb",
    };
  }
  if (BOOKING_HOST.test(host)) {
    const match = /^\/hotel\/[a-z]{2}\/[A-Za-z0-9_-]+(?:\.[a-z-]+)?\.html/.exec(
      url.pathname,
    );
    if (!match) return null;
    return { url: new URL(`https://${host}${match[0]}`), source: "booking" };
  }
  return null;
}

/** Hosts desde donde se puede bajar la foto del anuncio. */
export function isListingImageHost(hostname: string): boolean {
  return /(?:^|\.)(?:muscache\.com|bstatic\.com)$/i.test(hostname);
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === "#") {
      const num =
        code[1]?.toLowerCase() === "x"
          ? Number.parseInt(code.slice(2), 16)
          : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(num) && num > 0 && num < 0x110000
        ? String.fromCodePoint(num)
        : whole;
    }
    return ENTITIES[code.toLowerCase()] ?? whole;
  });
}

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  const plain = decodeEntities(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function metaTags(html: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    const content = /content\s*=\s*"([^"]*)"|content\s*=\s*'([^']*)'/i.exec(tag);
    const value = content?.[1] ?? content?.[2];
    if (key && value !== undefined && !map.has(key.toLowerCase())) {
      map.set(key.toLowerCase(), value);
    }
  }
  return map;
}

type Json = Record<string, unknown>;

function jsonLdObjects(html: string): Json[] {
  const found: Json[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") {
      const record = value as Json;
      found.push(record);
      if (record["@graph"]) visit(record["@graph"]);
    }
  };
  const pattern =
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      visit(JSON.parse(match[1] ?? ""));
    } catch {
      // JSON-LD roto: se ignora.
    }
  }
  return found;
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function imageOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return imageOf(value[0]);
  if (value && typeof value === "object") {
    return firstString((value as Json).url, (value as Json).contentUrl);
  }
  return "";
}

function timeOf(value: unknown): string {
  if (typeof value !== "string") return "";
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  return match ? `${match[1]!.padStart(2, "0")}:${match[2]}` : "";
}

function visibleText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

const TIME = String.raw`(\d{1,2}(?::\d{2})?\s?(?:[ap]\.?\s?m\.?)?)`;

function timeNear(text: string, labels: string): string {
  const match = new RegExp(
    String.raw`(?:${labels})[^\d]{0,40}${TIME}`,
    "i",
  ).exec(text);
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

const RULE_PATTERNS: readonly [RegExp, string][] = [
  [/no se permite fumar|no se puede fumar|no smoking/i, "No se permite fumar"],
  [
    /no se admiten mascotas|no se permiten mascotas|no pets/i,
    "No se admiten mascotas",
  ],
  [
    /no se permiten fiestas|no se admiten fiestas|no parties/i,
    "No se permiten fiestas ni eventos",
  ],
];

function titleOf(html: string, source: ListingSource): string {
  const raw = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "";
  const title = clean(raw, 300);
  if (!title) return "";
  if (source === "booking") {
    return title
      .replace(/\s*-\s*Booking\.com.*$/i, "")
      .replace(/\s*\([^)]*(?:precios|prices)[^)]*\)\s*$/i, "")
      .trim();
  }
  return title.split(/\s+[-–—]\s+/)[0]?.trim() ?? "";
}

function normalizedTimes(checkIn: string, checkOut: string) {
  return {
    checkIn: toTime24(checkIn) ?? checkIn,
    checkOut: toTime24(checkOut) ?? checkOut,
  };
}

export function parseListing(
  html: string,
  source: ListingSource,
): ListingData | null {
  const meta = metaTags(html);
  const objects = jsonLdObjects(html);
  const typed = objects.find(
    (o) => typeof o.name === "string" && (o.description || o.amenityFeature),
  );
  const any = (key: string) =>
    objects.map((o) => o[key]).find((v) => v !== undefined && v !== "");

  const name = clean(
    firstString(typed?.name, titleOf(html, source), meta.get("og:title")),
    120,
  );
  const description = clean(
    firstString(
      typed?.description,
      meta.get("og:description"),
      meta.get("description"),
    ),
    800,
  );
  if (!name && !description) return null;

  const amenityRaw = (typed?.amenityFeature ?? any("amenityFeature")) as unknown;
  const amenities: string[] = [];
  if (Array.isArray(amenityRaw)) {
    for (const item of amenityRaw) {
      if (!item || typeof item !== "object") continue;
      const record = item as Json;
      if (record.value === false) continue;
      const label = clean(record.name, 60);
      if (label && !amenities.includes(label)) amenities.push(label);
      if (amenities.length >= 20) break;
    }
  }

  const body = visibleText(html);
  const checkIn =
    timeOf(typed?.checkinTime ?? any("checkinTime")) ||
    timeNear(body, "check-?in|llegada|entrada");
  const checkOut =
    timeOf(typed?.checkoutTime ?? any("checkoutTime")) ||
    timeNear(body, "check-?out|salida");

  const rules = RULE_PATTERNS.filter(([pattern]) => pattern.test(body)).map(
    ([, label]) => label,
  );

  const image = imageOf(typed?.image ?? any("image")) || meta.get("og:image") || "";
  let imageUrl: string | null = null;
  try {
    const parsed = new URL(decodeEntities(image));
    if (parsed.protocol === "https:" && isListingImageHost(parsed.hostname)) {
      imageUrl = parsed.toString();
    }
  } catch {
    // sin foto
  }

  return {
    source,
    name,
    ...normalizedTimes(checkIn, checkOut),
    description,
    amenities,
    rules,
    imageUrl,
  };
}
