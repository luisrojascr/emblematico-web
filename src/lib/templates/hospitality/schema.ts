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

export const hospitalityContentSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  theme: themeSchema,
  tagline: text(140).default(""),
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
  whatsapp: whatsappSection.default({
    enabled: false,
    phone: "",
    message: "",
    label: "Escribir por WhatsApp",
  }),
});

export type HospitalityContent = z.infer<typeof hospitalityContentSchema>;
