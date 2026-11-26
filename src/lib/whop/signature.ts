import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Whop webhook signature check (Standard Webhooks headers).
 *
 * Whop signs `${webhook-id}.${webhook-timestamp}.${raw body}` with HMAC-SHA256 keyed
 * with the literal UTF-8 bytes of the endpoint secret, prefix included (`ws_...`).
 * This mirrors `unwrapWebhook` from `@whop/sdk/helpers` (SDK 2.8), without the
 * dependency. The header holds one or more space-separated `v1,<base64>` entries.
 */

/** Maximum clock skew accepted, in seconds (same as the Standard Webhooks libraries). */
export const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

export type SignatureHeaders = {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
};

export type SignatureResult =
  | { ok: true }
  | { ok: false; reason: "missing_headers" | "bad_timestamp" | "mismatch" };

export function signPayload(
  secret: string,
  id: string,
  timestamp: string,
  body: string,
): string {
  return createHmac("sha256", Buffer.from(secret, "utf8"))
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
}

export function verifyWhopSignature(
  secret: string,
  headers: SignatureHeaders,
  body: string,
  now: Date = new Date(),
): SignatureResult {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) {
    return { ok: false, reason: "missing_headers" };
  }

  const seconds = Number(timestamp);
  if (!/^\d+$/.test(timestamp) || !Number.isSafeInteger(seconds)) {
    return { ok: false, reason: "bad_timestamp" };
  }
  const skew = Math.abs(now.getTime() / 1000 - seconds);
  if (skew > SIGNATURE_TOLERANCE_SECONDS) {
    return { ok: false, reason: "bad_timestamp" };
  }

  const expected = Buffer.from(signPayload(secret, id, timestamp, body));
  for (const entry of signature.split(" ")) {
    const [version, value] = entry.split(",", 2);
    if (version !== "v1" || !value) continue;
    const given = Buffer.from(value);
    if (given.length === expected.length && timingSafeEqual(given, expected)) {
      return { ok: true };
    }
  }
  return { ok: false, reason: "mismatch" };
}
