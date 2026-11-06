import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { imageMime, sniffImage } from "@/lib/admin/images";
import type { Database } from "@/lib/supabase/database.types";

import { businessImagePath } from "./draft";

type Client = SupabaseClient<Database>;
type MediaType = Database["public"]["Enums"]["media_type"];

const BUCKET = "business-media";

export async function uploadBusinessImage(
  supabase: Client,
  businessId: string,
  entry: FormDataEntryValue | null,
  mediaType: MediaType,
): Promise<{ path: string } | { error: string } | null> {
  if (!(entry instanceof File) || entry.size === 0) return null;
  const bytes = new Uint8Array(await entry.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) {
    return { error: "La imagen debe ser JPG, PNG o WebP, de hasta 5 MB." };
  }
  const path = businessImagePath(businessId, kind);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: imageMime(kind), upsert: false });
  if (uploadError) {
    console.error("business image upload failed", uploadError.message);
    return { error: "No pudimos subir la imagen." };
  }
  const { error: rowError } = await supabase.from("media").insert({
    business_id: businessId,
    storage_path: path,
    media_type: mediaType,
    mime: imageMime(kind),
    size_bytes: bytes.length,
  });
  if (rowError) {
    console.error("business image record failed", rowError.message);
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: "No pudimos guardar la imagen." };
  }
  return { path };
}

/** Best-effort cleanup of an image neither page version still uses. */
export async function removeStoredImage(
  supabase: Client,
  path: string | null | undefined,
): Promise<void> {
  if (!path) return;
  const { error: rowError } = await supabase
    .from("media")
    .delete()
    .eq("storage_path", path);
  if (rowError) console.error("media row delete failed", rowError.message);
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error("storage delete failed", error.message);
}
