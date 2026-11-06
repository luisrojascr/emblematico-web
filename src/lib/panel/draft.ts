import { mediaPath } from "@/lib/templates/common";
import { generalContentSchema } from "@/lib/templates/general/schema";
import { hospitalityContentSchema } from "@/lib/templates/hospitality/schema";
import { type PageContent, type TemplateKey } from "@/lib/templates/registry";

import type { ImageKind } from "@/lib/admin/images";

export type DraftResult =
  { ok: true; page: PageContent } | { ok: false; message: string };

function assertNever(value: never): never {
  throw new Error(`Unhandled template key: ${String(value)}`);
}

/** A stored image may only point at this business's folder. */
export function ownsMediaPath(
  businessId: string,
  path: string | null | undefined,
): boolean {
  if (path == null) return true;
  return path.startsWith(`${businessId}/`) && mediaPath.safeParse(path).success;
}

export function businessImagePath(businessId: string, kind: ImageKind): string {
  return `${businessId}/${crypto.randomUUID()}.${kind}`;
}

function normalize(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const record = raw as Record<string, unknown>;
  const theme = record.theme;
  if (!theme || typeof theme !== "object" || Array.isArray(theme)) return raw;
  const themeRecord = { ...(theme as Record<string, unknown>) };
  if (themeRecord.logo_path === "") themeRecord.logo_path = null;
  if (themeRecord.cover_path === "") themeRecord.cover_path = null;
  return { ...record, theme: themeRecord };
}

function invalid(error: { issues: { message: string }[] }): DraftResult {
  return {
    ok: false,
    message:
      error.issues[0]?.message ??
      "Revisa los campos. Hay datos que no pudimos guardar.",
  };
}

function foreignImage(): DraftResult {
  return { ok: false, message: "La imagen no pertenece a este negocio." };
}

function themeOwned(
  businessId: string,
  theme: { logo_path?: string | null; cover_path?: string | null },
): boolean {
  return (
    ownsMediaPath(businessId, theme.logo_path) &&
    ownsMediaPath(businessId, theme.cover_path)
  );
}

/**
 * Validates a draft for one business. Unknown keys are stripped. Logo and cover
 * paths must live in this business's storage folder.
 */
export function draftForBusiness(
  templateKey: TemplateKey,
  raw: unknown,
  businessId: string,
): DraftResult {
  const normalized = normalize(raw);
  switch (templateKey) {
    case "hospitality": {
      const parsed = hospitalityContentSchema.safeParse(normalized);
      if (!parsed.success) return invalid(parsed.error);
      if (!themeOwned(businessId, parsed.data.theme)) return foreignImage();
      return { ok: true, page: { templateKey, content: parsed.data } };
    }
    case "general": {
      const parsed = generalContentSchema.safeParse(normalized);
      if (!parsed.success) return invalid(parsed.error);
      if (!themeOwned(businessId, parsed.data.theme)) return foreignImage();
      return { ok: true, page: { templateKey, content: parsed.data } };
    }
    default:
      return assertNever(templateKey);
  }
}
