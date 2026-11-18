import "server-only";

import { createClient } from "@/lib/supabase/server";

import { loadEntitlements } from "./entitlements";
import { pausedGuideIds } from "./entitlements-shared";

export type PanelProperty = {
  id: string;
  name: string;
  status: "active" | "suspended" | "archived";
  pageStatus: "draft" | "published" | "unpublished" | null;
  coverPath: string | null;
  /** Above the owner's plan limit: read-only, and its QR opens the enabled guide. */
  paused: boolean;
};

export type PanelOverview = {
  properties: PanelProperty[];
  /** null = no known limit (admins, or my_entitlements() failed). */
  limit: number | null;
  /**
   * Non-archived properties the user owns. This is what counts toward the limit
   * (same rule as create_my_business); properties they only edit do not count.
   */
  owned: number;
  /** Whether they can still create another property. */
  canCreate: boolean;
  /** How many of the listed properties are paused by the plan. */
  pausedCount: number;
};

export function coverOf(draft: unknown): string | null {
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) return null;
  const theme = (draft as { theme?: unknown }).theme;
  if (!theme || typeof theme !== "object" || Array.isArray(theme)) return null;
  const cover = (theme as { cover_path?: unknown }).cover_path;
  return typeof cover === "string" && cover !== "" ? cover : null;
}

export async function loadOverview(
  userId: string,
  isAdmin: boolean,
): Promise<PanelOverview> {
  const supabase = await createClient();
  const [
    { data: businesses },
    { data: pages },
    entitlements,
    { data: owners },
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, status, created_at")
      .order("name"),
    supabase.from("pages").select("business_id, status, draft_content"),
    isAdmin ? Promise.resolve(null) : loadEntitlements(),
    supabase
      .from("business_members")
      .select("business_id")
      .eq("user_id", userId)
      .eq("role", "owner"),
  ]);

  const ownedIds = new Set((owners ?? []).map((m) => m.business_id));
  const list = businesses ?? [];
  const limit = entitlements?.propertyLimit ?? null;

  const paused =
    limit === null
      ? new Set<string>()
      : pausedGuideIds(
          list
            .filter((b) => ownedIds.has(b.id))
            .map((b) => ({
              id: b.id,
              createdAt: b.created_at,
              status: b.status,
            })),
          limit,
        );
  // Guides the user edits for someone else follow that owner's plan, which only
  // the database knows. Admins see every guide, so they skip this (phase 4 admin).
  if (!isAdmin) {
    const shared = list.filter(
      (b) => !ownedIds.has(b.id) && b.status === "active",
    );
    const checks = await Promise.all(
      shared.map((b) =>
        supabase.rpc("business_is_active", { p_business_id: b.id }),
      ),
    );
    checks.forEach(({ data }, i) => {
      if (data === false) paused.add(shared[i]!.id);
    });
  }

  const byBusiness = new Map((pages ?? []).map((p) => [p.business_id, p]));
  const properties = list.map((business) => {
    const page = byBusiness.get(business.id);
    return {
      id: business.id,
      name: business.name,
      status: business.status,
      pageStatus: page?.status ?? null,
      coverPath: coverOf(page?.draft_content),
      paused: business.status === "active" && paused.has(business.id),
    };
  });
  const owned =
    entitlements?.propertiesUsed ??
    list.filter((b) => ownedIds.has(b.id) && b.status !== "archived").length;
  return {
    properties,
    limit,
    owned,
    canCreate: limit === null || owned < limit,
    pausedCount: properties.filter((p) => p.paused).length,
  };
}
