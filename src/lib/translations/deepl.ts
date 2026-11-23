import "server-only";

/**
 * Minimal DeepL client. Needs DEEPL_API_KEY on the server. Free keys end in
 * ":fx" and use a different host than Pro keys.
 */
export type TranslationLanguage = "es" | "en" | "fr";

const TARGET_CODES: Record<TranslationLanguage, string> = {
  es: "ES",
  en: "EN-US",
  fr: "FR",
};

const SOURCE_CODES: Record<TranslationLanguage, string> = {
  es: "ES",
  en: "EN",
  fr: "FR",
};

/** DeepL accepts at most 50 texts per request. */
const BATCH_SIZE = 50;
const TIMEOUT_MS = 20_000;

export type TranslateOutcome =
  | { ok: true; texts: string[] }
  | { ok: false; reason: "not_configured" | "quota" | "failed" };

export function translationConfigured(): boolean {
  return Boolean(process.env.DEEPL_API_KEY);
}

function endpoint(key: string): string {
  const host = key.endsWith(":fx")
    ? "https://api-free.deepl.com"
    : "https://api.deepl.com";
  return `${host}/v2/translate`;
}

/** Translates texts in order. The input texts are never logged. */
export async function translateTexts(
  texts: readonly string[],
  from: TranslationLanguage,
  to: TranslationLanguage,
): Promise<TranslateOutcome> {
  const key = process.env.DEEPL_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };
  if (texts.length === 0) return { ok: true, texts: [] };

  const out: string[] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    try {
      const response = await fetch(endpoint(key), {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: batch,
          source_lang: SOURCE_CODES[from],
          target_lang: TARGET_CODES[to],
          preserve_formatting: true,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      // 456 means the monthly character quota is used up.
      if (response.status === 456) return { ok: false, reason: "quota" };
      if (!response.ok) {
        console.error("deepl translate failed", response.status);
        return { ok: false, reason: "failed" };
      }
      const data = (await response.json()) as {
        translations?: { text?: unknown }[];
      };
      const items = data.translations ?? [];
      if (items.length !== batch.length) return { ok: false, reason: "failed" };
      for (const item of items) {
        if (typeof item.text !== "string") return { ok: false, reason: "failed" };
        out.push(item.text);
      }
    } catch {
      console.error("deepl translate request failed");
      return { ok: false, reason: "failed" };
    }
  }
  return { ok: true, texts: out };
}
