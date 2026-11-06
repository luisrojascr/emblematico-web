import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Invite links land on /auth/callback with the session in the URL fragment.
 * The fragment never reaches the server, and route handlers cannot rewrite,
 * so the confirmation page is served from here. The browser URL, including
 * the fragment, stays /auth/callback.
 */
function passThrough(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (request.nextUrl.pathname === "/auth/callback" && !code) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/confirmar";
    return NextResponse.rewrite(url, { request });
  }
  return NextResponse.next({ request });
}

/**
 * Refreshes the Supabase session cookie for authenticated areas only.
 * Authorization is NOT decided here; server code and RLS enforce it.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return passThrough(request);
  }

  let response = passThrough(request);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = passThrough(request);
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Validates and refreshes the token.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/panel/:path*",
    "/admin/:path*",
    "/api/qr/:path*",
    "/ingresar",
    "/auth/:path*",
  ],
};
