"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";

import {
  PANEL_LANGUAGE_COOKIE,
  PANEL_LOCALES,
  panelTranslator,
  type PanelLanguage,
  type PanelTranslator,
} from "@/lib/panel/i18n";

import {
  PanelCardsSkeleton,
  PanelEditorSkeleton,
  PanelProductsSkeleton,
  PanelSettingsSkeleton,
} from "./skeletons";

interface PanelI18n {
  language: PanelLanguage;
  locale: string;
  t: PanelTranslator;
  setLanguage: (language: PanelLanguage) => void;
}

const PanelLanguageContext = createContext<PanelI18n | null>(null);

export function PanelLanguageProvider({
  initial,
  children,
}: {
  initial: PanelLanguage;
  children: ReactNode;
}) {
  const [language, setCurrent] = useState(initial);
  const router = useRouter();

  function setLanguage(next: PanelLanguage) {
    if (next === language) return;
    document.cookie = `${PANEL_LANGUAGE_COOKIE}=${next}; Path=/panel; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setCurrent(next);
    router.refresh();
  }

  return (
    <PanelLanguageContext
      value={{
        language,
        locale: PANEL_LOCALES[language],
        t: panelTranslator(language),
        setLanguage,
      }}
    >
      <div lang={language} className="contents">
        {children}
      </div>
    </PanelLanguageContext>
  );
}

export function usePanelI18n(): PanelI18n {
  const context = useContext(PanelLanguageContext);
  if (!context)
    throw new Error("Panel language requires PanelLanguageProvider");
  return context;
}

/** Used by streamed loading fallbacks, which cannot read request cookies. */
export function PanelLoading({
  variant = "cards",
}: {
  variant?: "cards" | "editor" | "settings" | "products";
}) {
  const { t } = usePanelI18n();
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{t("Cargando...")}</span>
      {variant === "editor" ? (
        <PanelEditorSkeleton />
      ) : variant === "settings" ? (
        <PanelSettingsSkeleton />
      ) : variant === "products" ? (
        <PanelProductsSkeleton />
      ) : (
        <PanelCardsSkeleton />
      )}
    </div>
  );
}
