import "server-only";

import { redirect } from "next/navigation";

import { requireAdmin, type SessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminContext = {
  user: SessionUser;
  supabase: SupabaseClient<Database>;
};

/** Layout guard plus the database is_admin() check used by RLS. */
export async function assertAdmin(): Promise<AdminContext> {
  const user = await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  if (error || data !== true) redirect("/panel");
  return { user, supabase };
}
