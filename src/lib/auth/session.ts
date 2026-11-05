import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: "admin" | "client";
};

/** Verified user (token validated with Supabase Auth) + profile, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", data.user.id)
    .single();

  if (!profile) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    fullName: profile.full_name,
    role: profile.role,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/ingresar");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/panel");
  return user;
}

const DEFAULT_NEXT_PATH = "/panel";
// Placeholder origin used only to resolve and compare; never used to redirect.
const RESOLVE_BASE = "https://app.invalid";

/**
 * Returns a same-origin path (pathname + search + hash) or "/panel".
 *
 * The input is resolved with the WHATWG URL parser, the same one that
 * NextResponse.redirect(new URL(...)) uses, so inputs the parser rewrites
 * (e.g. "/\t/evil.com", "/\n/evil.com", "/\\evil.com") are judged by what they
 * actually resolve to. The returned value is the normalized URL, not the raw input.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/")) return DEFAULT_NEXT_PATH;

  let resolved: URL;
  try {
    resolved = new URL(next, RESOLVE_BASE);
  } catch {
    return DEFAULT_NEXT_PATH;
  }

  if (resolved.origin !== RESOLVE_BASE) return DEFAULT_NEXT_PATH;

  const path = `${resolved.pathname}${resolved.search}${resolved.hash}`;
  // Normalized output must itself be a single-slash absolute path.
  if (!path.startsWith("/") || path.startsWith("//")) return DEFAULT_NEXT_PATH;
  return path;
}
