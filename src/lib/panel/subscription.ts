import { PLANS, type Plan } from "@/lib/plans";

/**
 * El plan aún no tiene tabla propia: se deduce del texto que el admin pone en
 * "Plan de servicio" de cada negocio y, si no hay, del límite de alojamientos.
 */
export function detectPlan(
  servicePlans: readonly (string | null)[],
  maxProperties: number | null,
): Plan {
  for (const raw of servicePlans) {
    const text = (raw ?? "").toLowerCase();
    if (!text) continue;
    if (text.includes("admin") || text.includes("manager")) return PLANS[3];
    if (text.includes("plus")) return PLANS[2];
    if (text.includes("essential") || text.includes("esencial")) return PLANS[1];
    if (text.includes("free") || text.includes("grat")) return PLANS[0];
  }
  if (maxProperties === null || maxProperties <= 1) return PLANS[0];
  if (maxProperties < 5) return PLANS[1];
  if (maxProperties === 5) return PLANS[2];
  return PLANS[3];
}
