import "server-only";

import { createClient } from "@/lib/supabase/server";

export type PanelProperty = {
  id: string;
  name: string;
  status: "active" | "suspended" | "archived";
  pageStatus: "draft" | "published" | "unpublished" | null;
  coverPath: string | null;
};

export type PanelOverview = {
  properties: PanelProperty[];
  /** null = sin límite conocido (admin, o la migración aún no se aplicó). */
  limit: number | null;
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
  const [{ data: businesses }, { data: pages }, profile] = await Promise.all([
    supabase.from("businesses").select("id, name, status").order("name"),
    supabase.from("pages").select("business_id, status, draft_content"),
    isAdmin
      ? Promise.resolve(null)
      : supabase
          .from("profiles")
          .select("max_properties")
          .eq("id", userId)
          .maybeSingle(),
  ]);
  const byBusiness = new Map((pages ?? []).map((p) => [p.business_id, p]));
  const properties = (businesses ?? []).map((business) => {
    const page = byBusiness.get(business.id);
    return {
      id: business.id,
      name: business.name,
      status: business.status,
      pageStatus: page?.status ?? null,
      coverPath: coverOf(page?.draft_content),
    };
  });
  return {
    properties,
    limit: profile?.data?.max_properties ?? null,
  };
}
