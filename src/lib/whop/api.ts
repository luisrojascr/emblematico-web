import "server-only";

import type { WhopConfig } from "./config";
import type { WhopMembership } from "./membership";

/** Dated API version we were built against; sent on every request. */
export const WHOP_API_VERSION_DATE = "2026-11-04-1";

export const MEMBERSHIP_ID_RE = /^mem_[A-Za-z0-9]+$/;

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
  if (!config.apiKey) {
    throw new Error("WHOP_API_KEY is not configured");
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
    throw new Error(`membership fetch failed with HTTP ${response.status}`);
  }
  const membership = (await response.json()) as WhopMembership;
  if (membership?.id !== membershipId) {
    throw new Error("membership fetch returned an unexpected body");
  }
  return membership;
}
