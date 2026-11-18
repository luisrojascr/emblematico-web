import "server-only";

import { z } from "zod";

import { loadEntitlements } from "@/lib/panel/entitlements";
import { showsBranding } from "@/lib/panel/subscription";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type BusinessStatus = Database["public"]["Enums"]["business_status"];
type PageStatus = Database["public"]["Enums"]["page_status"];
type TemplateKey = Database["public"]["Enums"]["template_key"];

export type PanelPage = {
  id: string;
  name: string;
  slug: string;
  status: BusinessStatus;
  templateKey: TemplateKey;
  pageStatus: PageStatus;
  draft: unknown;
  updatedAt: string;
  /** Whether the guide shows "Página creada con emblemático" (per the business plan). */
  branding: boolean;
  /**
   * The guide is above the owner's plan limit. Clients cannot edit, publish or upload
   * media to it (the database blocks it); the editor must say so instead of failing silently.
   */
  pausedByPlan: boolean;
};

export async function loadPanelPage(id: string): Promise<PanelPage | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createClient();
  const [{ data: business }, { data: page }, { data: owners }, { data: auth }] =
    await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, slug, status, service_plan")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("pages")
        .select("template_key, draft_content, status, updated_at")
        .eq("business_id", id)
        .maybeSingle(),
      supabase
        .from("business_members")
        .select("user_id")
        .eq("business_id", id)
        .eq("role", "owner"),
      supabase.auth.getClaims(),
    ]);
  if (!business || !page) return null;
  const userId = auth?.claims.sub;

  let pausedByPlan = false;
  if (business.status === "active") {
    // business_is_active() is false for a paused guide, and an active guide is not suspended.
    const { data: usable } = await supabase.rpc("business_is_active", {
      p_business_id: id,
    });
    pausedByPlan = usable === false;
  }

  // Same rule as get_public_page: the owner's plan decides the branding, and only
  // guides without an owner fall back to the free-text service plan. When the
  // viewer is not the owner their plan is unknown here, so the text rule applies.
  let branding = showsBranding(business.service_plan);
  if (userId && (owners ?? []).some((m) => m.user_id === userId)) {
    const entitlements = await loadEntitlements();
    if (entitlements) branding = entitlements.plan === "free";
  }

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    status: business.status,
    templateKey: page.template_key,
    pageStatus: page.status,
    draft: page.draft_content,
    updatedAt: page.updated_at,
    branding,
    pausedByPlan,
  };
}
