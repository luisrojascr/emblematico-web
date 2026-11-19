import { reportReasonLabel } from "./schema";

/** Email to the admins about a new guide report. Pure, so it can be tested. */

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function reportEmail(input: {
  businessName: string;
  slug: string;
  reason: string;
  details: string;
  contactEmail: string;
  siteUrl: string;
}): { subject: string; html: string; text: string } {
  const guideUrl = `${input.siteUrl}/negocio/${input.slug}`;
  const adminUrl = `${input.siteUrl}/admin/reportes`;
  const lines: [string, string][] = [
    ["Guía", `${input.businessName} (${guideUrl})`],
    ["Motivo", reportReasonLabel(input.reason)],
    ["Detalle", input.details || "(sin detalle)"],
    ["Correo de quien reporta", input.contactEmail || "(no lo dejó)"],
  ];

  const text = [
    "Alguien reportó una guía en emblemático.",
    ...lines.map(([label, value]) => `${label}: ${value}`),
    `Revísalo en ${adminUrl}`,
  ].join("\n\n");

  const html = `<div style="font-family: Arial, Helvetica, sans-serif; color: #35352d; max-width: 560px;">
  <p style="font-size: 15px;">Alguien reportó una guía en emblemático.</p>
  ${lines
    .map(
      ([label, value]) =>
        `<p style="font-size: 15px; margin: 0 0 12px;"><strong>${escapeHtml(label)}:</strong><br>${escapeHtml(value).replaceAll("\n", "<br>")}</p>`,
    )
    .join("\n  ")}
  <p style="font-size: 15px;"><a href="${escapeHtml(adminUrl)}" style="color: #3d6a6e;">Ver reportes en el admin</a></p>
</div>`;

  return {
    subject: `Reporte de guía: ${input.businessName}`,
    html,
    text,
  };
}
