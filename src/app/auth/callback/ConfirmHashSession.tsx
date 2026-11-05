"use client";

import { useEffect } from "react";

import { sessionFromHash } from "@/lib/auth/hash-session";
import { createClient } from "@/lib/supabase/browser";

export function ConfirmHashSession() {
  useEffect(() => {
    const tokens = sessionFromHash(window.location.hash);
    if (!tokens) {
      window.location.replace("/ingresar?error=enlace");
      return;
    }

    const supabase = createClient();
    void supabase.auth
      .setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      })
      .then(async ({ data, error }) => {
        if (error || !data.user) {
          window.location.replace("/ingresar?error=enlace");
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        window.location.replace(
          profile?.role === "admin" ? "/admin" : "/panel",
        );
      });
  }, []);

  return <p role="status">Confirmando tu acceso...</p>;
}
