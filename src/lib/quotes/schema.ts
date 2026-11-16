import { z } from "zod";

import {
  BILLING_LABELS,
  BILLING_PERIODS,
  PLAN_IDS,
  getPlan,
} from "@/lib/plans";

export const ACCOMMODATION_TYPES = [
  "Villa o casa vacacional",
  "Airbnb o anfitrión independiente",
  "Administrador de propiedades",
  "Cabinas",
  "Hotel boutique",
  "Otro",
] as const;

export const CR_AREAS = [
  "Guanacaste",
  "Pacífico Central",
  "Pacífico Sur",
  "Caribe",
  "Zona Norte",
  "Valle Central",
  "Otra zona",
] as const;

/** Trimmed text; empty string becomes undefined. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .transform((v) => (v === "" ? undefined : v));

const requiredText = (max: number, message: string) =>
  z.string().trim().min(1, message).max(max, `Máximo ${max} caracteres`);

export const quoteRequestSchema = z.object({
  name: requiredText(120, "Ingresa tu nombre"),
  accommodation: requiredText(120, "Ingresa el nombre de tu alojamiento"),
  area: z.enum(CR_AREAS, { error: "Selecciona una zona" }),
  accommodationType: z.enum(ACCOMMODATION_TYPES, {
    error: "Selecciona un tipo de alojamiento",
  }),
  size: requiredText(60, "Indica cuántas propiedades o habitaciones tienes"),
  phone: requiredText(40, "Ingresa tu número de WhatsApp"),
  message: optionalText(1200),
  productSlug: optionalText(160),
  plan: optionalText(20).pipe(z.enum(PLAN_IDS).optional()),
  /** Periodo de cobro elegido (vacío = sin elegir). */
  billing: optionalText(20).pipe(z.enum(BILLING_PERIODS).optional()),
  /** Cantidad de piezas de bienvenida 3D (vacío = 0). */
  pieces: z
    .string()
    .trim()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(
      z
        .number({ error: "Ingresa un número" })
        .int("Ingresa un número entero")
        .min(0, "No puede ser negativo")
        .max(999, "Para más de 999 piezas, escríbenos"),
    ),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

/**
 * Los campos extra (alojamiento, zona, tamaño) todavía no tienen columnas propias
 * en `quote_requests`: se guardan dentro del texto del mensaje.
 */
export function composeQuoteMessage(input: QuoteRequestInput): string {
  const plan = getPlan(input.plan);
  const lines = [
    `Plan: ${plan?.name ?? "Aún no lo sé"}`,
    ...(plan?.price
      ? [
          `Facturación: ${input.billing ? BILLING_LABELS[input.billing] : "Sin definir"}`,
        ]
      : []),
    `Piezas de bienvenida 3D: ${input.pieces}`,
    `Alojamiento: ${input.accommodation}`,
    `Zona: ${input.area}`,
    `Propiedades o habitaciones: ${input.size}`,
  ];
  if (input.message) lines.push("", input.message);
  return lines.join("\n");
}
