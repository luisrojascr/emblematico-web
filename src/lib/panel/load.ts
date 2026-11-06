import "server-only";

import { z } from "zod";

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
};

export async function loadPanelPage(id: string): Promise<PanelPage | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createClient();
  const [{ data: business }, { data: page }] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, slug, status")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("pages")
      .select("template_key, draft_content, status, updated_at")
      .eq("business_id", id)
      .maybeSingle(),
  ]);
  if (!business || !page) return null;
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    status: business.status,
    templateKey: page.template_key,
    pageStatus: page.status,
    draft: page.draft_content,
    updatedAt: page.updated_at,
  };
}
