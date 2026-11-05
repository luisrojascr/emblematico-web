import type { Database } from "@/lib/supabase/database.types";

import { GeneralTemplate } from "./general/Template";
import { generalContentSchema, type GeneralContent } from "./general/schema";
import { HospitalityTemplate } from "./hospitality/Template";
import {
  hospitalityContentSchema,
  type HospitalityContent,
} from "./hospitality/schema";

export type TemplateKey = Database["public"]["Enums"]["template_key"];

export type PageContent =
  | { templateKey: "hospitality"; content: HospitalityContent }
  | { templateKey: "general"; content: GeneralContent };

export const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  hospitality: "Hospedaje",
  general: "Negocio general",
};

function assertNever(value: never): never {
  throw new Error(`Unhandled template key: ${String(value)}`);
}

/**
 * Validates raw JSON for a template. Unknown keys are stripped and missing
 * sections get disabled defaults. Returns null when the content is invalid.
 */
export function parsePageContent(
  templateKey: TemplateKey,
  raw: unknown,
): PageContent | null {
  switch (templateKey) {
    case "hospitality": {
      const parsed = hospitalityContentSchema.safeParse(raw ?? {});
      return parsed.success ? { templateKey, content: parsed.data } : null;
    }
    case "general": {
      const parsed = generalContentSchema.safeParse(raw ?? {});
      return parsed.success ? { templateKey, content: parsed.data } : null;
    }
    default:
      return assertNever(templateKey);
  }
}

/** Empty, valid content for a new page of this template. */
export function defaultContent(templateKey: TemplateKey): PageContent {
  const parsed = parsePageContent(templateKey, {});
  if (!parsed) throw new Error(`Default content invalid for ${templateKey}`);
  return parsed;
}

export function TemplateView({
  name,
  page,
}: {
  name: string;
  page: PageContent;
}) {
  switch (page.templateKey) {
    case "hospitality":
      return <HospitalityTemplate name={name} content={page.content} />;
    case "general":
      return <GeneralTemplate name={name} content={page.content} />;
    default:
      return assertNever(page);
  }
}
