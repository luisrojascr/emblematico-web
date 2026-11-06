import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { revalidatePublicPage } from "@/lib/pages/revalidate";
import type { Database } from "@/lib/supabase/database.types";

/** Drops the public cache for the current slug and every retired one. */
export async function revalidateBusiness(
  supabase: SupabaseClient<Database>,
  businessId: string,
  extraSlugs: readonly string[] = [],
) {
  const [{ data: business }, { data: history }] = await Promise.all([
    supabase
      .from("businesses")
      .select("slug")
      .eq("id", businessId)
      .maybeSingle(),
    supabase.from("slug_history").select("slug").eq("business_id", businessId),
  ]);

  const slugs = [
    business?.slug,
    ...extraSlugs,
    ...(history?.map((row) => row.slug) ?? []),
  ].filter((slug): slug is string => Boolean(slug));

  revalidatePublicPage({ businessId, slugs });
}
