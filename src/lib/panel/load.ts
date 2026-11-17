import "server-only";

import { z } from "zod";

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
  const [{ data: business }, { data: page }] = await Promise.all([
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
  ]);
  if (!business || !page) return null;

  let pausedByPlan = false;
  if (business.status === "active") {
    // business_is_active() is false for a paused guide, and an active guide is not suspended.
    const { data: usable } = await supabase.rpc("business_is_active", {
      p_business_id: id,
    });
    pausedByPlan = usable === false;
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
    branding: showsBranding(business.service_plan),
    pausedByPlan,
  };
}
