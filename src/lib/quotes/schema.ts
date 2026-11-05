import { z } from "zod";

export const BUSINESS_TYPES = [
  "Hotel o alojamiento",
  "Airbnb o alquiler vacacional",
  "Restaurante o café",
  "Tienda o comercio",
  "Salón, clínica o servicios",
  "Otro",
] as const;

/** Trimmed text; empty string becomes undefined. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .transform((v) => (v === "" ? undefined : v));

export const quoteRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Ingresa tu nombre")
      .max(120, "Máximo 120 caracteres"),
    phone: optionalText(40),
    email: optionalText(200).pipe(z.email("Correo no válido").optional()),
    businessType: optionalText(120).pipe(z.enum(BUSINESS_TYPES).optional()),
    productSlug: optionalText(160),
    message: optionalText(2000),
  })
  .refine((v) => v.phone || v.email, {
    message: "Déjanos un teléfono o un correo para contactarte",
    path: ["phone"],
  });

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
