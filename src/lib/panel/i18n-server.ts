import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import {
  PANEL_LANGUAGE_COOKIE,
  PANEL_LOCALES,
  panelLanguage,
  panelTranslator,
} from "./i18n";

export const getPanelI18n = cache(async () => {
  const language = panelLanguage(
    (await cookies()).get(PANEL_LANGUAGE_COOKIE)?.value,
  );
  return {
    language,
    locale: PANEL_LOCALES[language],
    t: panelTranslator(language),
  };
});
