import "server-only";

import type { WhopConfig } from "./config";
import type { WhopMembership } from "./membership";

/** Dated API version we were built against; sent on every request. */
export const WHOP_API_VERSION_DATE = "2026-11-04-1";

export const MEMBERSHIP_ID_RE = /^mem_[A-Za-z0-9]+$/;

/** A Whop API answer that is not 2xx; `status` lets callers tell 404 from outages. */
export class WhopApiError extends Error {
  constructor(readonly status: number) {
    super(`membership fetch failed with HTTP ${status}`);
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
