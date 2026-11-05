import { z } from "zod";

/** Bump when a template's content shape changes in a non-compatible way. */
export const SCHEMA_VERSION = 1;

/** Trimmed plain text (rendered as text, never HTML). Empty string is allowed. */
export const text = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres`);

/** Plain text kept exactly as typed (no trim). For credentials where spaces matter. */
export const verbatimText = (max: number) =>
  z.string().max(max, `Máximo ${max} caracteres`);

/** Trimmed text that must not be empty. */
export const requiredText = (max: number) =>
  text(max).min(1, "Este campo es obligatorio");

const SAFE_PROTOCOLS = new Set(["https:"]);

function parse(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/** https only, no credentials. Blank is allowed (section field left empty). */
export const httpsUrl = z
  .string()
  .trim()
  .max(500, "Máximo 500 caracteres")
  .refine(
    (v) => {
      if (v === "") return true;
      const url = parse(v);
      return (
        url !== null &&
        SAFE_PROTOCOLS.has(url.protocol) &&
        url.username === "" &&
        url.password === ""
      );
    },
    { message: "Debe ser un enlace que empiece con https://" },
  );

/** Link target for a call to action: https, wa.me or tel:. */
export const actionUrl = z
  .string()
  .trim()
  .max(500, "Máximo 500 caracteres")
  .refine(
    (v) => {
      if (v === "") return true;
      const url = parse(v);
      if (!url) return false;
      if (url.protocol === "tel:") return /^tel:\+?[0-9]{6,15}$/.test(v);
      if (url.protocol !== "https:") return false;
      if (url.username !== "" || url.password !== "") return false;
      return true;
    },
    { message: "Usa un enlace https:// o tel:+506..." },
  );

/** Phone for WhatsApp: digits only, with country code (8-digit CR numbers get 506). */
export const whatsappPhone = z
  .string()
  .trim()
  .max(30, "Máximo 30 caracteres")
  .transform((v) => {
    const digits = v.replace(/\D/g, "");
    return digits.length === 8 ? `506${digits}` : digits;
  })
  .refine((v) => v === "" || /^[0-9]{10,15}$/.test(v), {
    message: "Número no válido. Ejemplo: 8899 7060",
  });

export const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color no válido. Ejemplo: #C9AC87");

/** Object path inside the business-media bucket: {business_id}/{uuid}.{ext}. */
export const mediaPath = z
  .string()
  .trim()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/,
    "Imagen no válida",
  );

export const themeSchema = z
  .object({
    accent: hexColor.default("#C9AC87"),
    logo_path: mediaPath.nullish(),
    cover_path: mediaPath.nullish(),
  })
  .default({ accent: "#C9AC87" });

/** Wraps section fields with the on/off toggle every section has. */
export function section<T extends z.ZodRawShape>(shape: T) {
  return z.object({ enabled: z.boolean().default(false), ...shape });
}

export const whatsappSection = section({
  phone: whatsappPhone.default(""),
  message: text(300).default(""),
  label: text(40).default("Escribir por WhatsApp"),
});

export function whatsappHref(phone: string, message: string): string {
  const base = `https://wa.me/${phone}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
