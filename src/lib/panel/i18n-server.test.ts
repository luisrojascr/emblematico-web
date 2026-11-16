import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieValue } = vi.hoisted(() => ({ cookieValue: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieValue }),
}));

import { getPanelI18n } from "./i18n-server";
import { PANEL_LANGUAGE_COOKIE } from "./i18n";

describe("server dashboard language", () => {
  beforeEach(() => cookieValue.mockReset());

  it.each([
    ["en", "en-US", "Settings"],
    ["es", "es-CR", "Configuración"],
    ["fr", "fr-FR", "Paramètres"],
  ])(
    "renders the saved %s preference on the server",
    async (language, locale, heading) => {
      cookieValue.mockReturnValue({ value: language });
      const result = await getPanelI18n();
      expect(cookieValue).toHaveBeenCalledWith(PANEL_LANGUAGE_COOKIE);
      expect(result.language).toBe(language);
      expect(result.locale).toBe(locale);
      expect(result.t("Configuración")).toBe(heading);
    },
  );

  it.each([undefined, { value: "de" }, { value: "<script>" }])(
    "uses Spanish for a missing or invalid preference: %j",
    async (cookie) => {
      cookieValue.mockReturnValue(cookie);
      const result = await getPanelI18n();
      expect(result.language).toBe("es");
      expect(result.t("Mis hospedajes")).toBe("Mis hospedajes");
    },
  );
});
