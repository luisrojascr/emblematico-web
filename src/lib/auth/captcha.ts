/**
 * Cloudflare Turnstile glue. The widget (src/components/auth/TurnstileWidget.tsx) adds a
 * `cf-turnstile-response` field to the form; server actions pass it to Supabase Auth as
 * `captchaToken`, and Supabase verifies it with Cloudflare. Without
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY there is no widget and no check (local development).
 */
export const CAPTCHA_FIELD = "cf-turnstile-response";

export const CAPTCHA_MESSAGE =
  "Confirma que no eres un robot e inténtalo de nuevo.";

export function captchaEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export function captchaTokenOf(formData: FormData): string | undefined {
  const value = formData.get(CAPTCHA_FIELD);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** True when a token is required but the form did not carry one. */
export function captchaMissing(formData: FormData): boolean {
  return captchaEnabled() && captchaTokenOf(formData) === undefined;
}

/** Supabase Auth rejected the token (expired, reused or invalid). */
export function isCaptchaError(error: { code?: string } | null): boolean {
  return error?.code === "captcha_failed";
}
