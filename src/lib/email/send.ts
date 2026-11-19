import "server-only";

/**
 * Transactional email through the Resend HTTP API (same account and verified domain
 * as the Supabase Auth SMTP). Needs RESEND_API_KEY; EMAIL_FROM is optional.
 */
const DEFAULT_FROM = "emblemático <no-reply@mail.emblematicocr.com>";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      console.error(
        "email send failed",
        response.status,
        await response.text(),
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error(
      "email send failed",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
