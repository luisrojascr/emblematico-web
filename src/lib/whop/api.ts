import "server-only";

import type { WhopConfig } from "./config";
import type { WhopMembership } from "./membership";

/** Dated API version we were built against; sent on every request. */
export const WHOP_API_VERSION_DATE = "2026-11-04-1";

/**
 * Reads the current membership from Whop. Webhooks can arrive out of order, so the
 * route prefers this fresh copy over the event payload. Returns null when there is
 * no API key or the call fails, and the caller falls back to the payload.
 */
export async function fetchMembership(
  config: WhopConfig,
  membershipId: string,
): Promise<WhopMembership | null> {
  if (!config.apiKey || !/^mem_[A-Za-z0-9]+$/.test(membershipId)) return null;
  try {
    const response = await fetch(`${config.apiBase}/memberships/${membershipId}`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Api-Version-Date": WHOP_API_VERSION_DATE,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      console.error("whop membership fetch failed", response.status);
      return null;
    }
    return (await response.json()) as WhopMembership;
  } catch (error) {
    console.error("whop membership fetch error", (error as Error).name);
    return null;
  }
}
