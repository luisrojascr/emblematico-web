import { supabaseEnv } from "@/lib/supabase/env";

const BUCKET = "business-media";

/** Static assets ("/images/..."), absolute URLs, or Storage paths in business-media. */
export function mediaUrl(path: string): string {
  if (path.startsWith("/") || /^https?:\/\//.test(path)) return path;
  return `${supabaseEnv.url}/storage/v1/object/public/${BUCKET}/${path}`;
}
