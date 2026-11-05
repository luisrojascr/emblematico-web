import "server-only";

import { createHmac } from "node:crypto";

/**
 * Rate-limit identity for submit_quote_request(): HMAC-SHA256(IP, secret salt),
 * lowercase hex (64 chars), as required by the database function.
 *
 * Computed on the server from platform-provided headers, never from the browser
 * payload. The RPC itself is service_role-only, so this is the trusted boundary.
 */
export function clientIpFromHeaders(headers: Headers): string {
  // On Vercel these are set by the platform and cannot be forged by the client.
  const platformIp =
    headers.get("x-vercel-forwarded-for") ?? headers.get("x-real-ip");
  if (platformIp) return platformIp.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  // Unknown clients share one bucket (fails closed instead of unlimited).
  return "unknown";
}

export function quoteRateLimitIdentity(
  headers: Headers,
  salt: string | undefined = process.env.QUOTE_IP_SALT,
): string {
  if (!salt || salt.length < 16) {
    throw new Error("QUOTE_IP_SALT must be set (16+ characters)");
  }
  return createHmac("sha256", salt)
    .update(clientIpFromHeaders(headers))
    .digest("hex");
}
