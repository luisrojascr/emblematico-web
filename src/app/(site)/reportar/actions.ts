"use server";

import { headers } from "next/headers";

import { CAPTCHA_MESSAGE, captchaTokenOf } from "@/lib/auth/captcha";
import { verifyTurnstile } from "@/lib/auth/turnstile-verify";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { quoteRateLimitIdentity } from "@/lib/quotes/identity";
import { reportEmail } from "@/lib/reports/email";
import { type ReportInput, reportSchema } from "@/lib/reports/schema";
import { SITE } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReportState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof ReportInput, string>>;
};

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DONE = "Gracias. Recibimos tu reporte y vamos a revisar esta guía.";

/** REPORTS_EMAIL (comma separated) if set, otherwise every admin's email. */
async function reportRecipients(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<string[]> {
  const configured = (process.env.REPORTS_EMAIL ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (configured.length > 0) return configured;
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("role", "admin")
    .limit(10);
  if (error) {
    console.error("report recipients failed", error.code, error.message);
    return [];
  }
  return (data ?? [])
    .map((row) => row.email)
    .filter((email): email is string => Boolean(email));
}

export async function submitReport(
  _prev: ReportState,
  formData: FormData,
): Promise<ReportState> {
  // Honeypot: real visitors never see or fill this field. Pretend success to bots.
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "success", message: DONE };
  }

  const slug = String(formData.get("slug") ?? "");
  if (slug.length < 3 || slug.length > 60 || !SLUG_PATTERN.test(slug)) {
    return { status: "error", message: "No encontramos esta guía." };
  }

  const parsed = reportSchema.safeParse({
    reason: String(formData.get("reason") ?? ""),
    details: String(formData.get("details") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? "").trim(),
  });
  if (!parsed.success) {
    const fieldErrors: ReportState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "reason" || key === "details" || key === "contactEmail") {
        fieldErrors[key] ??= issue.message;
      }
    }
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors,
    };
  }

  if (!(await verifyTurnstile(captchaTokenOf(formData)))) {
    return { status: "error", message: CAPTCHA_MESSAGE };
  }

  let identity: string;
  try {
    // Same salted IP hash as the contact form; the raw IP is never stored.
    identity = quoteRateLimitIdentity(await headers());
  } catch (error) {
    console.error("report: rate-limit identity unavailable", error);
    return {
      status: "error",
      message: "No pudimos enviar tu reporte. Intenta más tarde.",
    };
  }

  const input = parsed.data;
  const supabase = createAdminClient();
  // submit_guide_report is service_role-only; the identity is computed here.
  const { data, error } = await supabase.rpc("submit_guide_report", {
    p_slug: slug,
    p_reason: input.reason,
    p_details: input.details,
    p_contact_email: input.contactEmail,
    p_ip_hash: identity,
  });
  if (error) {
    if (error.code === "P0001") {
      return {
        status: "error",
        message:
          "Recibimos muchos reportes desde tu conexión. Intenta de nuevo más tarde.",
      };
    }
    console.error("report: submit failed", error.code, error.message);
    return {
      status: "error",
      message: "No pudimos enviar tu reporte. Intenta de nuevo.",
    };
  }
  const row = data?.[0];
  if (!row) return { status: "error", message: "No encontramos esta guía." };

  // A repeat from the same visitor is accepted but not emailed again.
  if (!row.duplicate && emailConfigured()) {
    const recipients = await reportRecipients(supabase);
    const email = reportEmail({
      businessName: row.business_name,
      slug,
      reason: input.reason,
      details: input.details,
      contactEmail: input.contactEmail,
      siteUrl: SITE.url,
    });
    // The report is already stored; a failed email only shows up in the logs.
    await Promise.all(recipients.map((to) => sendEmail({ to, ...email })));
  }

  return { status: "success", message: DONE };
}
