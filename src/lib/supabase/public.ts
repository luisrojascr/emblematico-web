import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Cookie-less anon client for public, cacheable reads (catalog). Safe inside
 * `use cache` functions because it never touches request data. RLS still applies.
 */
export function createPublicClient() {
  return createClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
