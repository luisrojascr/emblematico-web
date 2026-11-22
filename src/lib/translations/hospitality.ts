import { isDefaultWelcome, isDefaultWhatsapp } from "@/lib/templates/i18n";
import type { HospitalityContent } from "@/lib/templates/hospitality/schema";

/**
 * Translatable text of a hospitality guide, addressed by a flat path such as
 * "welcome.message" or "rules.items.2". Verbatim data (Wi-Fi network and
 * password, URLs, phone, times) is never translated.
 */
export type FieldPath = string;

export interface SourceField {
  path: FieldPath;
  text: string;
}

/** One stored translation of one field. */
export interface TranslationEntry {
  /** The translated (or hand-edited) text. */
  text: string;
  /** Hash of the original text this entry was made from. */
  src: string;
  /** True once the host edited the text by hand; never auto-overwritten. */
  edited: boolean;
}

export type TranslationBlock = Record<FieldPath, TranslationEntry>;

export type FieldStatus = "missing" | "ok" | "outdated";

/** Small stable hash (FNV-1a, 32 bit) used to detect that the original changed. */
export function hashText(value: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** Sections whose items are places (name, kind, description, link). */
const PLACE_SECTIONS = ["tours", "wellness", "shopping", "parking"] as const;
/** Sections whose items are contacts (name, phone, detail, link). */
const CONTACT_SECTIONS = ["emergency", "taxi"] as const;

/** Every non-empty translatable string of the guide, in a stable order. */
export function sourceFields(c: HospitalityContent): SourceField[] {
  const out: SourceField[] = [];
  const add = (path: FieldPath, value: string | undefined) => {
    const text = (value ?? "").trim();
    if (text) out.push({ path, text });
  };
  add("tagline", c.tagline);
  if (c.welcome.enabled) {
    // The default title is already translated by the fixed guide texts.
    if (!isDefaultWelcome(c.welcome.title)) add("welcome.title", c.welcome.title);
    add("welcome.message", c.welcome.message);
  }
  if (c.wifi.enabled) add("wifi.notes", c.wifi.notes);
  if (c.stay.enabled) add("stay.notes", c.stay.notes);
  if (c.rules.enabled) {
    c.rules.items.forEach((item, i) => add(`rules.items.${i}`, item));
  }
  if (c.amenities.enabled) {
    c.amenities.items.forEach((item, i) => {
      add(`amenities.items.${i}.label`, item.label);
      add(`amenities.items.${i}.detail`, item.detail);
    });
  }
  if (c.recommendations.enabled) {
    c.recommendations.items.forEach((item, i) => {
      add(`recommendations.items.${i}.name`, item.name);
      add(`recommendations.items.${i}.category`, item.category);
      add(`recommendations.items.${i}.description`, item.description);
    });
  }
  for (const key of PLACE_SECTIONS) {
    if (!c[key].enabled) continue;
    c[key].items.forEach((item, i) => {
      add(`${key}.items.${i}.name`, item.name);
      add(`${key}.items.${i}.category`, item.category);
      add(`${key}.items.${i}.description`, item.description);
    });
  }
  for (const key of CONTACT_SECTIONS) {
    if (!c[key].enabled) continue;
    c[key].items.forEach((item, i) => {
      add(`${key}.items.${i}.name`, item.name);
      add(`${key}.items.${i}.detail`, item.detail);
    });
  }
  if (c.cleaning.enabled) add("cleaning.message", c.cleaning.message);
  if (c.minibar.enabled) {
    // Prices stay as typed; only names and details are translated.
    c.minibar.items.forEach((item, i) => {
      add(`minibar.items.${i}.name`, item.name);
      add(`minibar.items.${i}.detail`, item.detail);
    });
  }
  if (c.faq.enabled) {
    c.faq.items.forEach((item, i) => {
      add(`faq.items.${i}.question`, item.question);
      add(`faq.items.${i}.answer`, item.answer);
    });
  }
  if (c.whatsapp.enabled && c.whatsapp.phone && !isDefaultWhatsapp(c.whatsapp.label)) {
    add("whatsapp.label", c.whatsapp.label);
  }
  return out;
}

export function fieldStatus(
  field: SourceField,
  block: TranslationBlock | undefined,
): FieldStatus {
  const entry = block?.[field.path];
  if (!entry || !entry.text) return "missing";
  return entry.src === hashText(field.text) ? "ok" : "outdated";
}

/**
 * Fields that a "Traducir" press must send to the provider: missing ones, and
 * outdated ones the host did not edit by hand. Hand-edited fields are kept
 * unless `force` is set.
 */
export function fieldsToTranslate(
  fields: readonly SourceField[],
  block: TranslationBlock | undefined,
  force = false,
): SourceField[] {
  return fields.filter((field) => {
    const status = fieldStatus(field, block);
    if (status === "ok") return force;
    if (status === "missing") return true;
    return force || !block?.[field.path]?.edited;
  });
}

/** Merges fresh provider output into a block, marking entries as machine made. */
export function applyTranslations(
  block: TranslationBlock | undefined,
  results: ReadonlyArray<{ field: SourceField; text: string }>,
): TranslationBlock {
  const next: TranslationBlock = { ...(block ?? {}) };
  for (const { field, text } of results) {
    next[field.path] = {
      text: text.trim(),
      src: hashText(field.text),
      edited: false,
    };
  }
  return next;
}

/** Records a manual edit. Keeps the source hash so "outdated" still works. */
export function applyManualEdit(
  block: TranslationBlock | undefined,
  field: SourceField,
  text: string,
): TranslationBlock {
  return {
    ...(block ?? {}),
    [field.path]: { text, src: hashText(field.text), edited: true },
  };
}

/** Drops entries whose field no longer exists in the original. */
export function pruneBlock(
  block: TranslationBlock | undefined,
  fields: readonly SourceField[],
): TranslationBlock {
  const live = new Set(fields.map((f) => f.path));
  return Object.fromEntries(
    Object.entries(block ?? {}).filter(([path]) => live.has(path)),
  );
}

/**
 * Text a guest sees for a field in a language: the translation when there is
 * one, otherwise the host's original (guests never see an empty field).
 */
export function pick(
  block: TranslationBlock | undefined,
  path: FieldPath,
  original: string,
): string {
  const text = block?.[path]?.text;
  return text ? text : original;
}
