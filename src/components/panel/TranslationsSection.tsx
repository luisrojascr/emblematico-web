"use client";

import { useState, useTransition } from "react";
import type { UseFormReturn } from "react-hook-form";

import { translateGuide } from "@/app/(panel)/panel/[businessId]/translate-actions";
import { usePanelI18n } from "@/components/panel/PanelLanguageProvider";
import { GUIDE_LANGUAGES, type GuideLanguage } from "@/lib/templates/i18n";
import type { HospitalityContent } from "@/lib/templates/hospitality/schema";
import {
  applyManualEdit,
  fieldStatus,
  sourceFields,
  type FieldStatus,
} from "@/lib/translations/hospitality";

import {
  panelInputClass,
  panelPrimaryButtonClass,
  panelSecondaryButtonClass as secondaryButtonClass,
} from "./ui";

const LANGUAGE_NAMES: Record<GuideLanguage, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
};

const STATUS_LABELS: Record<FieldStatus, string> = {
  missing: "Sin traducir",
  ok: "Al día",
  outdated: "Desactualizada",
};

/** Status chip colors; each is paired with a text label, never color alone. */
const STATUS_STYLES: Record<FieldStatus, string> = {
  missing: "bg-cream-dark/70 text-ink-soft",
  ok: "bg-teal/15 text-teal-deep",
  outdated: "bg-sand/30 text-ink",
};

/**
 * Per-language copies of the host's text. "Traducir" fills what is missing or
 * outdated through DeepL; the host reviews and edits, then saves the draft as
 * usual. Hand-edited texts are never overwritten by a normal translate.
 */
export function TranslationsSection({
  form,
  businessId,
  enabled,
}: {
  form: UseFormReturn<HospitalityContent>;
  businessId: string;
  enabled: boolean;
}) {
  const { t } = usePanelI18n();
  const values = form.watch();
  const original = values.language;
  const targets = GUIDE_LANGUAGES.filter((lang) => lang !== original);
  const [picked, setPicked] = useState<GuideLanguage>(targets[0] ?? "en");
  const tab = targets.includes(picked) ? picked : (targets[0] ?? "en");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fields = sourceFields(values);
  const block = values.translations?.[tab];
  const counts = { missing: 0, outdated: 0 };
  for (const field of fields) {
    const status = fieldStatus(field, block);
    if (status !== "ok") counts[status] += 1;
  }

  function setBlock(next: NonNullable<typeof block>) {
    form.setValue(`translations.${tab}`, next, {
      shouldDirty: true,
      shouldTouch: true,
    });
  }

  function translate(force: boolean) {
    setMessage(null);
    startTransition(async () => {
      const result = await translateGuide(
        businessId,
        JSON.stringify(form.getValues()),
        tab,
        force,
      );
      if (!result.ok) {
        setMessage(t(result.message));
        return;
      }
      setBlock(result.block);
      setMessage(
        result.translated > 0
          ? t("Traducción lista. Revísala y guarda el borrador.")
          : t("Todo está al día."),
      );
    });
  }

  const pendingCount = counts.missing + counts.outdated;
  const done = fields.length - pendingCount;
  const percent = fields.length === 0 ? 0 : Math.round((done / fields.length) * 100);

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl">{t("Traducciones")}</h2>
        <p className="text-ink-soft text-sm">
          {t(
            "Tus huéspedes verán tu texto en el idioma que elijan. Traduce con un clic y corrige lo que quieras antes de guardar.",
          )}
        </p>
      </div>
      {!enabled ? (
        <div
          role="status"
          className="border-ink/20 bg-cream/70 rounded-2xl border border-dashed p-4 text-sm"
        >
          {t("Las traducciones están disponibles en Essential y Plus.")}
        </div>
      ) : (
        <>
          <div
            role="tablist"
            aria-label={t("Traducciones")}
            className="bg-cream-dark/60 inline-flex gap-1 rounded-full p-1"
          >
            {targets.map((lang) => (
              <button
                key={lang}
                type="button"
                role="tab"
                aria-selected={lang === tab}
                onClick={() => setPicked(lang)}
                className={`min-h-10 rounded-full px-5 text-sm font-semibold transition-colors ${
                  lang === tab
                    ? "bg-white text-ink shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {LANGUAGE_NAMES[lang]}
              </button>
            ))}
          </div>

          <div className="border-cream-dark space-y-3 rounded-2xl border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                {t("{done} de {total} textos al día", {
                  done,
                  total: fields.length,
                })}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={pending || fields.length === 0}
                  onClick={() => translate(true)}
                  className="text-ink-soft hover:text-ink text-sm underline underline-offset-4 disabled:opacity-50"
                >
                  {t("Volver a traducir todo")}
                </button>
                <button
                  type="button"
                  disabled={pending || fields.length === 0}
                  onClick={() => translate(false)}
                  className={
                    pendingCount > 0
                      ? panelPrimaryButtonClass
                      : secondaryButtonClass
                  }
                >
                  {pending ? t("Traduciendo...") : t("Traducir")}
                </button>
              </div>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label={t("Traducciones")}
              className="bg-cream-dark h-2 overflow-hidden rounded-full"
            >
              <div
                className="bg-teal h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${percent}%` }}
              />
            </div>
            {pendingCount > 0 ? (
              <p className="text-ink-soft text-xs">
                {`${counts.missing} ${t("sin traducir")} · ${counts.outdated} ${t("desactualizadas")}`}
              </p>
            ) : null}
            {message ? (
              <p
                role="status"
                className="bg-cream/70 text-ink rounded-xl px-3 py-2 text-sm"
              >
                {message}
              </p>
            ) : null}
          </div>

          <ul className="space-y-3">
            {fields.map((field) => {
              const status = fieldStatus(field, block);
              const entry = block?.[field.path];
              const lines = Math.max(
                field.text.split("\n").length,
                (entry?.text ?? "").split("\n").length,
              );
              const rows = Math.min(
                10,
                Math.max(
                  2,
                  lines,
                  Math.ceil(
                    Math.max(field.text.length, entry?.text.length ?? 0) / 45,
                  ),
                ),
              );
              return (
                <li
                  key={field.path}
                  className="border-cream-dark rounded-2xl border bg-white p-4"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="min-w-0 space-y-1">
                      <p className="text-ink-soft text-xs font-bold tracking-wider uppercase">
                        {t("Original")}
                      </p>
                      <p className="bg-cream/70 max-h-40 overflow-y-auto rounded-xl px-3 py-2 text-sm whitespace-pre-line">
                        {field.text}
                      </p>
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={`tr-${tab}-${field.path}`}
                          className="text-ink-soft text-xs font-bold tracking-wider uppercase"
                        >
                          {LANGUAGE_NAMES[tab]}
                        </label>
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[status]}`}
                          >
                            {t(STATUS_LABELS[status])}
                          </span>
                          {entry?.edited ? (
                            <span className="bg-cream-dark/70 text-ink-soft rounded-full px-2 py-0.5 text-xs font-bold">
                              {t("Editada")}
                            </span>
                          ) : null}
                        </span>
                      </div>
                      <textarea
                        id={`tr-${tab}-${field.path}`}
                        rows={rows}
                        className={panelInputClass}
                        value={entry?.text ?? ""}
                        onChange={(event) =>
                          setBlock(
                            applyManualEdit(block, field, event.target.value),
                          )
                        }
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
