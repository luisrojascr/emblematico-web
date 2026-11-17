/**
 * Textos fijos de la guía en ES/EN/FR. Se imprimen los tres idiomas y el CSS
 * (ver `[data-guide-lang]` en globals.css) muestra solo el elegido, así el
 * cambio de idioma no necesita volver a pedir la página ni rompe su caché.
 * El texto que escribe el anfitrión no se traduce todavía.
 */

export const GUIDE_LANGUAGES = ["es", "en", "fr"] as const;
export type GuideLanguage = (typeof GUIDE_LANGUAGES)[number];

export const GUIDE_TEXT = {
  welcome: { es: "Bienvenida", en: "Welcome", fr: "Bienvenue" },
  wifi: { es: "Wi‑Fi", en: "Wi‑Fi", fr: "Wi‑Fi" },
  network: { es: "Red", en: "Network", fr: "Réseau" },
  password: { es: "Contraseña", en: "Password", fr: "Mot de passe" },
  stay: { es: "Tu estadía", en: "Your stay", fr: "Votre séjour" },
  checkIn: { es: "Llegada", en: "Check-in", fr: "Arrivée" },
  checkOut: { es: "Salida", en: "Check-out", fr: "Départ" },
  rules: {
    es: "Reglas de la casa",
    en: "House rules",
    fr: "Règles de la maison",
  },
  amenities: { es: "Servicios", en: "Amenities", fr: "Équipements" },
  recommendations: {
    es: "Recomendaciones",
    en: "Recommendations",
    fr: "Recommandations",
  },
  whatsapp: {
    es: "Escribir por WhatsApp",
    en: "Message us on WhatsApp",
    fr: "Écrire sur WhatsApp",
  },
  madeWith: {
    es: "Página creada con",
    en: "Page made with",
    fr: "Page créée avec",
  },
  language: { es: "Idioma", en: "Language", fr: "Langue" },
  copy: { es: "Copiar", en: "Copy", fr: "Copier" },
  copied: { es: "Copiada", en: "Copied", fr: "Copié" },
} as const satisfies Record<string, Record<GuideLanguage, string>>;

export type GuideTextKey = keyof typeof GUIDE_TEXT;

/** Un texto fijo en los tres idiomas; el CSS muestra el activo. */
export function T({ k }: { k: GuideTextKey }) {
  const text = GUIDE_TEXT[k];
  return (
    <>
      {GUIDE_LANGUAGES.map((lang) => (
        <span key={lang} data-l={lang} lang={lang}>
          {text[lang]}
        </span>
      ))}
    </>
  );
}

/** Valores por defecto en español que se reemplazan por el texto traducido. */
const DEFAULT_WELCOME = new Set(["bienvenido", "bienvenida", "bienvenidos"]);
const DEFAULT_WHATSAPP = new Set(["escribir por whatsapp"]);

export function isDefaultWelcome(title: string): boolean {
  return !title.trim() || DEFAULT_WELCOME.has(title.trim().toLowerCase());
}

export function isDefaultWhatsapp(label: string): boolean {
  return !label.trim() || DEFAULT_WHATSAPP.has(label.trim().toLowerCase());
}
