import { GUIDE_LANGUAGES, type GuideLanguage } from "../i18n";

import type { TranslationBlock } from "@/lib/translations/hospitality";

export type GuideTranslations = Partial<
  Record<GuideLanguage, TranslationBlock | undefined>
>;

/**
 * Text the host wrote, in every language of the guide. The original language
 * shows the host's text; the others show the translation, or the original
 * when there is none. CSS (`[data-l]`) shows only the language the guest chose,
 * so switching needs no request. With no translations it renders plain text.
 */
export function HostText({
  path,
  original,
  language,
  translations,
}: {
  path: string;
  original: string;
  language: GuideLanguage;
  translations: GuideTranslations;
}) {
  const texts = GUIDE_LANGUAGES.map((lang) => ({
    lang,
    text:
      lang === language
        ? original
        : translations[lang]?.[path]?.text || original,
  }));
  if (texts.every((entry) => entry.text === original)) return <>{original}</>;
  return (
    <>
      {texts.map(({ lang, text }) => (
        <span key={lang} data-l={lang} lang={lang}>
          {text}
        </span>
      ))}
    </>
  );
}
