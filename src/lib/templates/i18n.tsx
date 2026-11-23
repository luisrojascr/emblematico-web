/**
 * Fixed guide texts in ES/EN/FR. All three languages are rendered and CSS (see
 * `[data-guide-lang]` in globals.css) shows only the chosen one, so switching
 * language needs no new request and keeps the page cache intact.
 * The text the host writes is not translated yet.
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
  tours: {
    es: "Tours recomendados",
    en: "Recommended tours",
    fr: "Excursions recommandées",
  },
  wellness: {
    es: "Bienestar y gimnasio",
    en: "Wellness and gym",
    fr: "Bien-être et salle de sport",
  },
  shopping: {
    es: "Compras y servicios",
    en: "Shopping and services",
    fr: "Courses et services",
  },
  emergency: { es: "Emergencias", en: "Emergencies", fr: "Urgences" },
  cleaning: { es: "Limpieza", en: "Cleaning", fr: "Ménage" },
  minibar: {
    es: "Minibar y precios",
    en: "Minibar and prices",
    fr: "Minibar et tarifs",
  },
  taxi: { es: "Taxi", en: "Taxi", fr: "Taxi" },
  parking: {
    es: "Parqueos cercanos",
    en: "Nearby parking",
    fr: "Parkings à proximité",
  },
  faq: {
    es: "Preguntas frecuentes",
    en: "Frequently asked questions",
    fr: "Questions fréquentes",
  },
  call: { es: "Llamar", en: "Call", fr: "Appeler" },
  openLink: { es: "Abrir enlace", en: "Open link", fr: "Ouvrir le lien" },
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
  reportGuide: {
    es: "Reportar esta guía",
    en: "Report this guide",
    fr: "Signaler ce guide",
  },
  language: { es: "Idioma", en: "Language", fr: "Langue" },
  copy: { es: "Copiar", en: "Copy", fr: "Copier" },
  copied: { es: "Copiada", en: "Copied", fr: "Copié" },
} as const satisfies Record<string, Record<GuideLanguage, string>>;

export type GuideTextKey = keyof typeof GUIDE_TEXT;

/** A fixed text in all three languages; CSS shows the active one. */
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

/** Spanish default values that are replaced by the translated text. */
const DEFAULT_WELCOME = new Set(["bienvenido", "bienvenida", "bienvenidos"]);
const DEFAULT_WHATSAPP = new Set(["escribir por whatsapp"]);

export function isDefaultWelcome(title: string): boolean {
  return !title.trim() || DEFAULT_WELCOME.has(title.trim().toLowerCase());
}

export function isDefaultWhatsapp(label: string): boolean {
  return !label.trim() || DEFAULT_WHATSAPP.has(label.trim().toLowerCase());
}
