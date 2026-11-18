import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

import { parseEntitlements, type Entitlements } from "./entitlements-shared";

/**
 * The signed-in user's plan, trial and property limit. Cached per request, so the
 * panel layout (trial banner) and the page share one call. Returns null when the
 * call fails; callers must then behave as before (no banner, no limit shown).
 */
export const loadEntitlements = cache(
  async (): Promise<Entitlements | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("my_entitlements");
    if (error) {
      console.error("my_entitlements failed", error.code, error.message);
      return null;
    }
    return parseEntitlements(data);
  },
);
