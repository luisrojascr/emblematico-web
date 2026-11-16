import { describe, expect, it } from "vitest";

import {
  PANEL_LANGUAGES,
  PANEL_TEXT,
  panelLanguage,
  panelTranslator,
} from "./i18n";

describe("dashboard language", () => {
  it("accepts English, Spanish and French and falls back safely", () => {
    expect(PANEL_LANGUAGES.map((language) => language.value)).toEqual([
      "en",
      "es",
      "fr",
    ]);
    for (const language of ["en", "es", "fr"])
      expect(panelLanguage(language)).toBe(language);
    for (const invalid of [undefined, null, "de", "EN", "fr-FR", "", {}])
      expect(panelLanguage(invalid)).toBe("es");
  });

  it("translates navigation, forms and action feedback", () => {
    const en = panelTranslator("en");
    const fr = panelTranslator("fr");
    expect(en("Mis hospedajes")).toBe("My properties");
    expect(fr("Configuración")).toBe("Paramètres");
    expect(en("Guardar borrador")).toBe("Save draft");
    expect(fr("Las contraseñas no coinciden.")).toBe(
      "Les mots de passe ne correspondent pas.",
    );
    expect(panelTranslator("es")("Mis hospedajes")).toBe("Mis hospedajes");
  });

  it("interpolates values literally and handles shared schema errors", () => {
    expect(
      panelTranslator("fr")("Paso {step} de {total}", { step: 2, total: 3 }),
    ).toBe("Étape 2 sur 3");
    expect(panelTranslator("en")("Máximo 140 caracteres")).toBe(
      "Maximum 140 characters",
    );
    expect(
      panelTranslator("en")("{file} se guardará con el borrador.", {
        file: "$& {file}.png",
      }),
    ).toBe("$& {file}.png will be saved with the draft.");
  });

  it("handles multiline interface copy and preserves unknown text", () => {
    expect(panelTranslator("en")("Crea tu\n primera guía")).toBe(
      "Create your first guide",
    );
    expect(panelTranslator("fr")("  Casa Bahía · Guest Wi-Fi  ")).toBe(
      "  Casa Bahía · Guest Wi-Fi  ",
    );
  });

  it("has nonempty English and French translations for every message", () => {
    for (const [source, translations] of Object.entries(PANEL_TEXT)) {
      expect(translations.en.trim(), source).not.toBe("");
      expect(translations.fr.trim(), source).not.toBe("");
      const placeholders = (value: string) =>
        [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
      expect(placeholders(translations.en), source).toEqual(
        placeholders(source),
      );
      expect(placeholders(translations.fr), source).toEqual(
        placeholders(source),
      );
    }
  });
});
