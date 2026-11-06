import { z } from "zod";

import { slugError } from "./slug";

export const templateKeySchema = z.enum(["hospitality", "general"], {
  error: "Elige una plantilla.",
});

const optionalSlug = z.string().trim().max(60);

export const createBusinessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre")
    .max(120, "Máximo 120 caracteres"),
  category: z.string().trim().max(60, "Máximo 60 caracteres"),
  template: templateKeySchema,
  slug: optionalSlug,
});

const localDateTime = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value),
    {
      message: "Fecha no válida.",
    },
  );

export const updateBusinessSchema = z.object({
  businessId: z.uuid("Negocio no válido."),
  name: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre")
    .max(120, "Máximo 120 caracteres"),
  category: z.string().trim().max(60, "Máximo 60 caracteres"),
  template: templateKeySchema,
  slug: optionalSlug,
  servicePlan: z.string().trim().max(60, "Máximo 60 caracteres"),
  serviceExpiresAt: localDateTime,
  indexable: z.boolean(),
  confirmSlug: z.boolean(),
  confirmTemplate: z.boolean(),
});

export const businessIdSchema = z.object({
  businessId: z.uuid("Negocio no válido."),
});

export const assignMemberSchema = z.object({
  businessId: z.uuid("Elige un negocio."),
  userId: z.uuid("Elige una persona."),
  role: z.enum(["owner", "editor"]),
});

export const removeMemberSchema = z.object({
  businessId: z.uuid(),
  userId: z.uuid(),
});

export const inviteSchema = z.object({
  email: z.email("Ingresa un correo válido.").max(200),
  fullName: z.string().trim().max(120, "Máximo 120 caracteres"),
});

export const quoteStatusSchema = z.object({
  quoteId: z.uuid(),
  status: z.enum(["new", "contacted", "closed"]),
});

const catalogSlug = z.string().trim().max(80);

export const categorySchema = z.object({
  id: z.uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre")
    .max(120, "Máximo 120 caracteres"),
  slug: catalogSlug,
  description: z.string().trim().max(1000, "Máximo 1000 caracteres"),
  removeImage: z.boolean(),
});

export const productSchema = z.object({
  id: z.uuid().optional(),
  categoryId: z.uuid("Elige una categoría."),
  name: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre")
    .max(160, "Máximo 160 caracteres"),
  slug: catalogSlug,
  summary: z.string().trim().max(300, "Máximo 300 caracteres"),
  description: z.string().trim().max(4000, "Máximo 4000 caracteres"),
  isActive: z.boolean(),
  removeImage: z.boolean(),
});

export const reorderSchema = z.object({
  id: z.uuid(),
  direction: z.enum(["up", "down"]),
});

export function checked(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

/** Costa Rica has no daylight-saving time. Empty input clears the expiry. */
export function expiryToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}:00-06:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function isServiceExpired(
  iso: string | null,
  now = Date.now(),
): boolean {
  if (!iso) return false;
  const time = new Date(iso).getTime();
  return Number.isFinite(time) && time < now;
}

export function validateBusinessSlug(slug: string): string | null {
  return slugError(slug);
}

export type ActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const idleState: ActionState = { status: "idle" };

export function zodFieldErrors(
  error: z.ZodError,
  keys: readonly string[],
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && keys.includes(key) && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

export function postgresMessage(error: {
  code?: string;
  message: string;
}): string {
  const message = error.message.toLowerCase();
  if (message.includes("retired") || message.includes("cannot be reused")) {
    return "Ese slug ya se usó y no se puede reutilizar.";
  }
  if (message.includes("not_reserved") || message.includes("reservado")) {
    return "Ese slug está reservado.";
  }
  if (message.includes("slug_format")) {
    return "Usa de 3 a 60 caracteres: minúsculas, números y guiones.";
  }
  if (message.includes("nothing to publish")) {
    return "No hay contenido para publicar.";
  }
  if (message.includes("not active")) {
    return "Solo puedes publicar un negocio activo.";
  }
  if (error.code === "23505") return "Ese dato ya existe. Revisa el slug.";
  return "No pudimos guardar los cambios.";
}
