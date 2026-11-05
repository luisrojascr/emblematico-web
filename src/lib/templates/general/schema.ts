import { z } from "zod";

import {
  SCHEMA_VERSION,
  actionUrl,
  httpsUrl,
  requiredText,
  section,
  text,
  themeSchema,
  whatsappSection,
} from "../common";

export const generalContentSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  theme: themeSchema,
  tagline: text(140).default(""),
  cta: section({
    label: text(40).default(""),
    url: actionUrl.default(""),
  }).default({ enabled: false, label: "", url: "" }),
  description: section({
    title: text(80).default("Sobre nosotros"),
    body: text(1500).default(""),
  }).default({ enabled: false, title: "Sobre nosotros", body: "" }),
  location: section({
    address: text(300).default(""),
    hours: text(500).default(""),
    maps_url: httpsUrl.default(""),
  }).default({ enabled: false, address: "", hours: "", maps_url: "" }),
  menu: section({
    label: text(40).default("Ver menú"),
    url: httpsUrl.default(""),
  }).default({ enabled: false, label: "Ver menú", url: "" }),
  reviews: section({
    url: httpsUrl.default(""),
  }).default({ enabled: false, url: "" }),
  social: section({
    links: z
      .array(
        z.object({
          label: requiredText(40),
          url: httpsUrl.refine((v) => v !== "", "Ingresa un enlace"),
        }),
      )
      .max(8)
      .default([]),
  }).default({ enabled: false, links: [] }),
  whatsapp: whatsappSection.default({
    enabled: false,
    phone: "",
    message: "",
    label: "Escribir por WhatsApp",
  }),
});

export type GeneralContent = z.infer<typeof generalContentSchema>;
