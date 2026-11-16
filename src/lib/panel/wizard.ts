import { z } from "zod";

import {
  requiredText,
  text,
  verbatimText,
  whatsappPhone,
} from "@/lib/templates/common";
import {
  hospitalityContentSchema,
  type HospitalityContent,
} from "@/lib/templates/hospitality/schema";

export const WIZARD_LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
] as const;

/** Secciones opcionales del paso 2. Solo las marcadas pasan a la guía. */
export const WIZARD_SECTIONS = [
  "welcome",
  "wifi",
  "contact",
  "stay",
  "rules",
  "amenities",
  "recommendations",
] as const;
export type WizardSection = (typeof WIZARD_SECTIONS)[number];

const sectionsSchema = z.object({
  welcome: z.boolean().default(false),
  wifi: z.boolean().default(false),
  contact: z.boolean().default(false),
  stay: z.boolean().default(false),
  rules: z.boolean().default(false),
  amenities: z.boolean().default(false),
  recommendations: z.boolean().default(false),
});

/** Lo que el asistente de "Agregar hospedaje" recoge, en forma plana. */
const wizardFields = z.object({
  name: requiredText(120),
  language: z.enum(["es", "en", "fr"]).default("es"),
  sections: sectionsSchema.default({
    welcome: false,
    wifi: false,
    contact: false,
    stay: false,
    rules: false,
    amenities: false,
    recommendations: false,
  }),
  tagline: text(140).default(""),
  welcome: text(800).default(""),
  wifiNetwork: verbatimText(60).default(""),
  wifiPassword: verbatimText(80).default(""),
  checkIn: text(60).default(""),
  checkOut: text(60).default(""),
  stayNotes: text(400).default(""),
  rules: z.array(text(200)).max(15).default([]),
  amenities: z.array(text(60)).max(20).default([]),
  recommendations: z
    .array(
      z.object({
        name: text(80),
        description: text(300).default(""),
      }),
    )
    .max(12)
    .default([]),
  whatsapp: whatsappPhone.default(""),
});

/** Campos que pertenecen a cada sección opcional del paso 2. */
const SECTION_FIELDS: Record<WizardSection, readonly (keyof z.input<typeof wizardFields>)[]> = {
  welcome: ["welcome"],
  wifi: ["wifiNetwork", "wifiPassword"],
  contact: ["whatsapp"],
  stay: ["checkIn", "checkOut", "stayNotes"],
  rules: ["rules"],
  amenities: ["amenities"],
  recommendations: ["recommendations"],
};

/**
 * Lo escrito en una sección desmarcada no se valida: se descarta antes,
 * igual que hace buildContent. Así un número a medias en "Cómo contactarte"
 * no bloquea el asistente si la sección se desmarcó. Los valores del
 * formulario no se tocan, por si la vuelven a marcar.
 */
function dropDisabledSections(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const values = { ...(input as Record<string, unknown>) };
  const sections = (values.sections ?? {}) as Partial<Record<WizardSection, unknown>>;
  for (const section of WIZARD_SECTIONS) {
    if (sections[section] === true) continue;
    for (const field of SECTION_FIELDS[section]) delete values[field];
  }
  return values;
}

export const wizardSchema = z.preprocess(dropDisabledSections, wizardFields);

export type WizardValues = z.input<typeof wizardFields>;
export type WizardParsed = z.output<typeof wizardFields>;
export type WizardForm = Required<Omit<WizardValues, "sections" | "recommendations">> & {
  sections: Record<WizardSection, boolean>;
  recommendations: { name: string; description: string }[];
};

export const EMPTY_WIZARD: WizardForm = {
  name: "",
  language: "es",
  sections: {
    welcome: false,
    wifi: false,
    contact: false,
    stay: false,
    rules: false,
    amenities: false,
    recommendations: false,
  },
  tagline: "",
  welcome: "",
  wifiNetwork: "",
  wifiPassword: "",
  checkIn: "",
  checkOut: "",
  stayNotes: "",
  rules: [],
  amenities: [],
  recommendations: [],
  whatsapp: "",
};

function clean(items: readonly string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

/**
 * Convierte las respuestas del asistente en el contenido de la plantilla.
 * Una sección queda visible solo si está marcada y tiene datos; lo que se
 * escribió en una sección desmarcada se descarta.
 */
export function buildContent(values: WizardParsed): HospitalityContent {
  const on = values.sections;
  const rules = on.rules ? clean(values.rules) : [];
  const amenities = on.amenities ? clean(values.amenities) : [];
  const recommendations = on.recommendations
    ? values.recommendations
        .map((r) => ({ name: r.name.trim(), description: r.description.trim() }))
        .filter((r) => r.name)
    : [];
  const welcome = on.welcome ? values.welcome : "";
  const wifi = on.wifi
    ? { network: values.wifiNetwork, password: values.wifiPassword }
    : { network: "", password: "" };
  const stay = on.stay
    ? {
        check_in: values.checkIn,
        check_out: values.checkOut,
        notes: values.stayNotes,
      }
    : { check_in: "", check_out: "", notes: "" };
  const phone = on.contact ? values.whatsapp : "";

  return hospitalityContentSchema.parse({
    language: values.language,
    tagline: values.tagline,
    welcome: { enabled: Boolean(welcome), title: "Bienvenido", message: welcome },
    wifi: { enabled: Boolean(wifi.network), ...wifi, notes: "" },
    stay: {
      enabled: Boolean(stay.check_in || stay.check_out || stay.notes),
      ...stay,
    },
    rules: { enabled: rules.length > 0, items: rules },
    amenities: {
      enabled: amenities.length > 0,
      items: amenities.map((label) => ({ label, detail: "" })),
    },
    recommendations: {
      enabled: recommendations.length > 0,
      items: recommendations.map((r) => ({
        name: r.name,
        category: "",
        description: r.description,
        url: "",
      })),
    },
    whatsapp: {
      enabled: Boolean(phone),
      phone,
      message: `Hola, estoy en ${values.name}`.slice(0, 300),
      label: "Escribir por WhatsApp",
    },
  });
}
