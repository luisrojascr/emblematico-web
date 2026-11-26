"use server";

import { z } from "zod";

import { loadEntitlements } from "@/lib/panel/entitlements";
import { draftForBusiness } from "@/lib/panel/draft";
import { loadPanelPage } from "@/lib/panel/load";
import {
  translateTexts,
  translationConfigured,
} from "@/lib/translations/deepl";
import {
  applyTranslations,
  fieldsToTranslate,
  pruneBlock,
  sourceFields,
  type TranslationBlock,
} from "@/lib/translations/hospitality";

export type TranslateResult =
  | {
      ok: true;
      /** Full block for the language; the editor keeps it in the draft. */
      block: TranslationBlock;
      translated: number;
      kept: number;
    }
  | { ok: false; message: string };

const TARGETS = ["es", "en", "fr"] as const;

/**
 * Translates the editor's current text into one language. It does not save:
 * the host reviews the result and saves the draft as usual.
 */
export async function translateGuide(
  businessId: string,
  rawContent: string,
  language: string,
  force = false,
): Promise<TranslateResult> {
  const target = z.enum(TARGETS).safeParse(language);
  if (!target.success) return { ok: false, message: "Idioma no disponible." };

  const page = await loadPanelPage(businessId);
  if (!page) return { ok: false, message: "No encontramos este negocio." };
  if (page.status !== "active" || page.pausedByPlan) {
    return { ok: false, message: "Esta guía no se puede editar ahora." };
  }
  if (page.templateKey !== "hospitality") {
    return { ok: false, message: "Esta plantilla aún no tiene traducciones." };
  }

  const entitlements = await loadEntitlements();
  if (!entitlements || entitlements.plan === "free") {
    return {
      ok: false,
      message: "Las traducciones están disponibles en los planes de pago.",
    };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(rawContent);
  } catch {
    return { ok: false, message: "No recibimos el contenido." };
  }
  const draft = draftForBusiness("hospitality", raw, businessId);
  if (!draft.ok || draft.page.templateKey !== "hospitality") {
    return { ok: false, message: "Revisa los campos antes de traducir." };
  }
  const content = draft.page.content;
  if (content.language === target.data) {
    return {
      ok: false,
      message: "Ese es el idioma original de la guía.",
    };
  }

  if (!translationConfigured()) {
    return { ok: false, message: "La traducción automática no está activa." };
  }

  const fields = sourceFields(content);
  const current = pruneBlock(content.translations[target.data], fields);
  const pending = fieldsToTranslate(fields, current, force);
  if (pending.length === 0) {
    return { ok: true, block: current, translated: 0, kept: fields.length };
  }

  const result = await translateTexts(
    pending.map((f) => f.text),
    content.language,
    target.data,
  );
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.reason === "quota"
          ? "Se agotó el límite de traducciones de este mes. Inténtalo más tarde."
          : "No pudimos traducir ahora. Inténtalo de nuevo.",
    };
  }

  const block = applyTranslations(
    current,
    pending.map((field, i) => ({ field, text: result.texts[i] ?? "" })),
  );
  return {
    ok: true,
    block,
    translated: pending.length,
    kept: fields.length - pending.length,
  };
}
