import { type NextRequest, NextResponse } from "next/server";

import { safeNextPath } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const explicitNext = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (explicitNext) {
        return NextResponse.redirect(
          new URL(safeNextPath(explicitNext), origin),
        );
      }
      const { data } = await supabase.auth.getUser();
      const { data: profile } = data.user
        ? await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single()
        : { data: null };
      const target = profile?.role === "admin" ? "/admin" : "/panel";
      return NextResponse.redirect(new URL(target, origin));
    }
    return NextResponse.redirect(new URL("/ingresar?error=enlace", origin));
  }

  // Invite links arrive as a URL fragment, which the server never sees.
  // A rewrite keeps that fragment on /auth/callback while the page reads it.
  return NextResponse.rewrite(new URL("/auth/confirmar", request.url));
}
