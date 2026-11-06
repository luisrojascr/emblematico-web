import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { catalogImagePath, imageMime, sniffImage } from "./images";

type Client = SupabaseClient<Database>;

export async function takenBusinessSlugs(
  supabase: Client,
  exceptBusinessId?: string,
): Promise<Set<string>> {
  const [{ data: businesses }, { data: history }] = await Promise.all([
    supabase.from("businesses").select("id, slug"),
    supabase.from("slug_history").select("slug, business_id"),
  ]);
  const taken = new Set<string>();
  for (const row of businesses ?? []) {
    if (row.id !== exceptBusinessId) taken.add(row.slug);
  }
  for (const row of history ?? []) {
    if (row.business_id !== exceptBusinessId) taken.add(row.slug);
  }
  return taken;
}

export async function uploadCatalogFile(
  supabase: Client,
  entry: FormDataEntryValue | null,
): Promise<{ path: string } | { error: string } | null> {
  if (!(entry instanceof File) || entry.size === 0) return null;
  const bytes = new Uint8Array(await entry.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) {
    return { error: "La imagen debe ser JPG, PNG o WebP, de hasta 5 MB." };
  }
  const path = catalogImagePath(kind);
  const { error } = await supabase.storage
    .from("business-media")
    .upload(path, bytes, {
      contentType: imageMime(kind),
      upsert: false,
    });
  if (error) {
    console.error("catalog upload failed", error.message);
    return { error: "No pudimos subir la imagen." };
  }
  return { path };
}
