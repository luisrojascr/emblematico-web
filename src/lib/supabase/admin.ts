import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Service-role client. Bypasses RLS. Server-only; use exclusively for admin
 * operations that need it (e.g. inviting users) after verifying is_admin().
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient<Database>(supabaseEnv.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
