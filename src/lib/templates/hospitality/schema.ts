import { z } from "zod";

import {
  SCHEMA_VERSION,
  httpsUrl,
  requiredText,
  section,
  text,
  verbatimText,
  themeSchema,
  whatsappSection,
} from "../common";

/** One translated field: text, hash of the original it came from, hand-edited flag. */
const translationEntry = z.object({
  text: z.string().max(1500),
  src: z.string().max(16),
  edited: z.boolean().default(false),
});

/** Translations of one language, keyed by field path (see lib/translations). */
const translationBlock = z.record(z.string().max(80), translationEntry);

/** A place the host recommends: name, kind, short description and link. */
const placeItem = z.object({
  name: requiredText(80),
  category: text(40).default(""),
  description: text(300).default(""),
  url: httpsUrl.default(""),
});

/** A contact: name, phone exactly as typed, short detail and link. */
const contactItem = z.object({
  name: requiredText(80),
  phone: verbatimText(40).default(""),
  detail: text(200).default(""),
  url: httpsUrl.default(""),
});

/** A minibar product; the price is kept exactly as typed ("$3", "₡1.500"). */
const minibarItem = z.object({
  name: requiredText(60),
  price: verbatimText(30).default(""),
  detail: text(120).default(""),
});

const faqItem = z.object({
  question: requiredText(120),
  answer: text(500).default(""),
});

export const hospitalityContentSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  theme: themeSchema,
  /** Language the host writes the guide in; the other two come from `translations`. */
  language: z.enum(["es", "en", "fr"]).default("es"),
  tagline: text(140).default(""),
  /** Optional per-language copies of the host's text. Guests fall back to the original. */
  translations: z
    .object({
      es: translationBlock.optional(),
      en: translationBlock.optional(),
      fr: translationBlock.optional(),
    })
    .default({}),
  welcome: section({
    title: text(80).default("Bienvenido"),
    message: text(800).default(""),
  }).default({ enabled: false, title: "Bienvenido", message: "" }),
  wifi: section({
    network: verbatimText(60).default(""),
    password: verbatimText(80).default(""),
    notes: text(200).default(""),
  }).default({ enabled: false, network: "", password: "", notes: "" }),
  stay: section({
    check_in: text(60).default(""),
    check_out: text(60).default(""),
    notes: text(400).default(""),
  }).default({ enabled: false, check_in: "", check_out: "", notes: "" }),
  rules: section({
    items: z.array(requiredText(200)).max(15).default([]),
  }).default({ enabled: false, items: [] }),
  amenities: section({
    items: z
      .array(
        z.object({
          label: requiredText(60),
          detail: text(200).default(""),
        }),
      )
      .max(20)
      .default([]),
  }).default({ enabled: false, items: [] }),
  recommendations: section({
    items: z
      .array(
        z.object({
          name: requiredText(80),
          category: text(40).default(""),
          description: text(300).default(""),
          url: httpsUrl.default(""),
        }),
      )
      .max(12)
      .default([]),
  }).default({ enabled: false, items: [] }),
  tours: section({ items: z.array(placeItem).max(12).default([]) }).default({
    enabled: false,
    items: [],
  }),
  wellness: section({ items: z.array(placeItem).max(12).default([]) }).default({
    enabled: false,
    items: [],
  }),
  shopping: section({ items: z.array(placeItem).max(12).default([]) }).default({
    enabled: false,
    items: [],
  }),
  emergency: section({
    items: z.array(contactItem).max(12).default([]),
  }).default({ enabled: false, items: [] }),
  cleaning: section({ message: text(800).default("") }).default({
    enabled: false,
    message: "",
  }),
  minibar: section({ items: z.array(minibarItem).max(30).default([]) }).default({
    enabled: false,
    items: [],
  }),
  taxi: section({ items: z.array(contactItem).max(12).default([]) }).default({
    enabled: false,
    items: [],
  }),
  parking: section({ items: z.array(placeItem).max(12).default([]) }).default({
    enabled: false,
    items: [],
  }),
  faq: section({ items: z.array(faqItem).max(20).default([]) }).default({
    enabled: false,
    items: [],
  }),
  whatsapp: whatsappSection.default({
    enabled: false,
    phone: "",
    message: "",
    label: "Escribir por WhatsApp",
  }),
});

export type HospitalityContent = z.infer<typeof hospitalityContentSchema>;
