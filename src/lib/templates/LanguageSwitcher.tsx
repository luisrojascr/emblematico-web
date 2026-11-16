"use client";

import { useRef, useState } from "react";

import { GUIDE_LANGUAGES, type GuideLanguage } from "./i18n";

/** Botones ES/EN/FR: cambian el idioma visible de la guía sin recargar. */
export function LanguageSwitcher({ initial }: { initial: GuideLanguage }) {
  const ref = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState<GuideLanguage>(initial);

  function pick(lang: GuideLanguage) {
    setCurrent(lang);
    const root = ref.current?.closest<HTMLElement>("[data-guide-lang]");
    if (root) {
      root.dataset.guideLang = lang;
      root.lang = lang;
    }
  }

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Idioma / Language / Langue"
      className="flex gap-1 rounded-full bg-white/90 p-1 shadow-sm backdrop-blur"
    >
      {GUIDE_LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          aria-pressed={current === lang}
          onClick={() => pick(lang)}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
            current === lang ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
