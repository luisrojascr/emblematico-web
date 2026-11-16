"use client";

import { useId } from "react";

import { PANEL_LANGUAGES, isPanelLanguage } from "@/lib/panel/i18n";

import { usePanelI18n } from "./PanelLanguageProvider";

export function PanelLanguageSwitcher() {
  const id = useId();
  const { language, setLanguage, t } = usePanelI18n();
  return (
    <div className="space-y-1.5 px-2">
      <label htmlFor={id} className="text-cream/70 block text-xs font-semibold">
        {t("Idioma del panel")}
      </label>
      <select
        id={id}
        value={language}
        onChange={(event) => {
          if (isPanelLanguage(event.target.value))
            setLanguage(event.target.value);
        }}
        className="border-cream/30 bg-ink text-cream focus-visible:outline-sand w-full rounded-lg border px-2 py-2 text-sm"
      >
        {PANEL_LANGUAGES.map((option) => (
          <option key={option.value} value={option.value} lang={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
