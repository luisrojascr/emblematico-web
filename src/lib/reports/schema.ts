import { z } from "zod";

/**
 * "Reportar esta guía" (phase 6). Reasons match the check constraint on
 * guide_reports.reason in migration 16.
 */
export const REPORT_REASONS = [
  { id: "scam", label: "Parece una estafa o un fraude" },
  { id: "misleading", label: "Tiene información falsa o engañosa" },
  { id: "inappropriate", label: "Tiene contenido ofensivo o inapropiado" },
  { id: "other", label: "Otro motivo" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["id"];

const REASON_IDS = REPORT_REASONS.map((reason) => reason.id) as [
  ReportReason,
  ...ReportReason[],
];

export function reportReasonLabel(id: string): string {
  return REPORT_REASONS.find((reason) => reason.id === id)?.label ?? id;
}

export const REPORT_DETAILS_MAX = 1000;

export const reportSchema = z.object({
  reason: z.enum(REASON_IDS, { message: "Elige un motivo." }),
  details: z
    .string()
    .trim()
    .max(REPORT_DETAILS_MAX, `Máximo ${REPORT_DETAILS_MAX} caracteres.`),
  contactEmail: z.union([
    z.literal(""),
    z.email("Revisa el correo.").max(200, "Máximo 200 caracteres."),
  ]),
});

export type ReportInput = z.infer<typeof reportSchema>;
