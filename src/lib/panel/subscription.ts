import { PLANS, type Plan } from "@/lib/plans";

/**
 * Plan named in a business's free-text "service plan", or `undefined` if it names
 * none. Only used for guides without an owner (legacy, admin-managed); keep it in
 * line with the keyword fallback for `branding` in get_public_page
 * (supabase/migrations/20261117000012_subscriptions.sql).
 */
export function planFromText(raw: string | null | undefined): Plan | undefined {
  const text = (raw ?? "").toLowerCase();
  if (!text) return undefined;
  if (text.includes("admin") || text.includes("manager")) return PLANS[3];
  if (text.includes("plus")) return PLANS[2];
  if (text.includes("essential") || text.includes("esencial")) return PLANS[1];
  if (text.includes("free") || text.includes("grat")) return PLANS[0];
  return undefined;
}

/**
 * Whether a guide without an owner shows "Página creada con emblemático". With no
 * recognizable plan it does (like Free): removing it is a paid-plan benefit.
 */
export function showsBranding(servicePlan: string | null | undefined): boolean {
  return !planFromText(servicePlan)?.removesBranding;
}
