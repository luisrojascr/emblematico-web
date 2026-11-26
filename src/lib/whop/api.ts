import "server-only";

import type { WhopConfig } from "./config";
import { METADATA_USER_KEY, type WhopMembership } from "./membership";

/** Dated API version we were built against; sent on every request. */
export const WHOP_API_VERSION_DATE = "2026-11-04-1";

export const MEMBERSHIP_ID_RE = /^mem_[A-Za-z0-9]+$/;

/** A Whop API answer that is not 2xx; `status` lets callers tell 404 from outages. */
export class WhopApiError extends Error {
  constructor(
    readonly status: number,
    what = "membership fetch",
  ) {
    super(`${what} failed with HTTP ${status}`);
    this.name = "WhopApiError";
  }
}

/**
 * Reads the current membership from Whop.
 *
 * Webhooks can arrive out of order and carry a snapshot from when they were sent, so
 * the subscription is always written from this fresh copy, never from the payload.
 * Any failure (no API key, timeout, non-2xx) throws: the route answers 5xx and Whop
 * redelivers the event later, instead of applying a possibly stale snapshot.
 */
export async function fetchMembership(
  config: WhopConfig,
  membershipId: string,
): Promise<WhopMembership> {
  if (!config.apiKey || !config.apiBase) {
    throw new Error("WHOP_API_KEY or WHOP_ENVIRONMENT is not configured");
  }
  if (!MEMBERSHIP_ID_RE.test(membershipId)) {
    throw new Error("invalid membership id");
  }
  const response = await fetch(
    `${config.apiBase}/memberships/${membershipId}`,
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Api-Version-Date": WHOP_API_VERSION_DATE,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    },
  );
  if (!response.ok) {
    throw new WhopApiError(response.status);
  }
  const membership = (await response.json()) as WhopMembership;
  if (membership?.id !== membershipId) {
    throw new Error("membership fetch returned an unexpected body");
  }
  return membership;
}

/**
 * Creates a one-off checkout for a price and returns its URL. The Supabase user id
 * goes in the metadata, which Whop copies to the payment and the membership: that is
 * how the webhook links the purchase to the account.
 */
export async function createCheckout(
  config: WhopConfig,
  input: { variantId: string; userId: string; redirectUrl: string },
): Promise<string> {
  if (!config.apiKey || !config.apiBase) {
    throw new Error("WHOP_API_KEY or WHOP_ENVIRONMENT is not configured");
  }
  const response = await fetch(`${config.apiBase}/checkout_configurations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Api-Version-Date": WHOP_API_VERSION_DATE,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      variant_id: input.variantId,
      metadata: { [METADATA_USER_KEY]: input.userId },
      redirect_url: input.redirectUrl,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new WhopApiError(response.status, "checkout create");
  }
  const body = (await response.json()) as { purchase_url?: unknown };
  const url = whopUrl(body?.purchase_url);
  if (!url) throw new Error("checkout create returned no purchase_url");
  return url;
}

/** Only https links on a Whop domain are followed; anything else is ignored. */
export function whopUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return null;
    if (host !== "whop.com" && !host.endsWith(".whop.com")) return null;
    return url.toString();
  } catch {
    return null;
  }
}
