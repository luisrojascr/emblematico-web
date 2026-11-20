import "server-only";

/**
 * Server-side Turnstile check for forms that do not go through Supabase Auth (for
 * example "Reportar esta guía"). Supabase verifies the signup and login tokens itself;
 * here the site does it with TURNSTILE_SECRET_KEY, the same secret set in Supabase.
 *
 * Without the secret the check is skipped (local development); the honeypot and the
 * database rate limits still apply.
 */
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function turnstileSecretConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(
  token: string | undefined,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error(
      "turnstile verify failed",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
