import { z } from "zod";

import { isCountryCode } from "./countries";

/** Email awaiting confirmation (HttpOnly cookie), so "check your email" can offer a resend. */
export const PENDING_EMAIL_COOKIE = "signup_email";

export const PASSWORD_MIN_LENGTH = 8;
/** bcrypt, used by Supabase Auth, ignores everything past 72 bytes. */
export const PASSWORD_MAX_LENGTH = 72;

export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH)
    .max(PASSWORD_MAX_LENGTH)
    .regex(/[A-Za-z]/)
    .regex(/\d/),
  country: z.string().refine(isCountryCode),
  acceptTerms: z.literal(true),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const PASSWORD_RULE_MESSAGE = `Tu contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres, con letras y números.`;

/** First failing field -> the message shown to the user. */
export function signupIssueMessage(error: z.ZodError): string {
  const field = error.issues[0]?.path[0];
  switch (field) {
    case "fullName":
      return "Escribe tu nombre (mínimo 2 letras).";
    case "email":
      return "Escribe un correo válido.";
    case "password":
      return PASSWORD_RULE_MESSAGE;
    case "country":
      return "Elige tu país.";
    case "acceptTerms":
      return "Para crear tu cuenta debes aceptar los términos y la política de privacidad.";
    default:
      return "Revisa los datos e inténtalo de nuevo.";
  }
}

/** Lowercased, trimmed email as read from a form. */
export function normalizeEmailInput(value: FormDataEntryValue | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}
