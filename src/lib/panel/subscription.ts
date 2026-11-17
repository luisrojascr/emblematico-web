import { ESSENTIAL_MAX_PROPERTIES, PLANS, type Plan } from "@/lib/plans";

/**
 * Plan según el texto libre de "Plan de servicio" del negocio, o `undefined` si no
 * menciona ninguno. Mantener alineado con `branding` en get_public_page
 * (supabase/migrations/20261116000011_public_page_branding.sql).
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
 * Si la guía lleva "Página creada con emblemático". Sin plan reconocible se
 * muestra (como Free): quitarla es un beneficio de los planes de pago.
 */
export function showsBranding(servicePlan: string | null | undefined): boolean {
  return !planFromText(servicePlan)?.removesBranding;
}

/**
 * El plan aún no tiene tabla propia: se deduce del texto que el admin pone en
 * "Plan de servicio" de cada negocio. Si no hay texto, el límite de alojamientos
 * solo sirve de pista: los cupos se cruzan (Essential llega a 7 con adicionales,
 * Plus suma adicionales sin límite y el plan para administradores también pasa
 * de 10), así que se elige el plan más bajo compatible y nunca se supone Plus
 * ni administradores donde Essential también encaja. Para Plus o administradores
 * con 7 o menos alojamientos, el admin debe escribir el plan.
 */
export function detectPlan(
  servicePlans: readonly (string | null)[],
  maxProperties: number | null,
): Plan {
  for (const raw of servicePlans) {
    const plan = planFromText(raw);
    if (plan) return plan;
  }
  if (maxProperties === null || maxProperties <= 1) return PLANS[0];
  if (maxProperties <= ESSENTIAL_MAX_PROPERTIES) return PLANS[1];
  return PLANS[2];
}
