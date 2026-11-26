import { getPlan, type PlanId } from "@/lib/plans";

/**
 * Reminder emails of the daily subscription job (phase 5 of self-serve signup).
 * Pure: which notice a subscription is due for, and the email for it. The job route
 * sends them and records each one in subscription_notices so it goes out once.
 */

export type NoticeKind =
  | "trial_7d"
  | "trial_3d"
  | "trial_ended"
  | "paid_7d"
  | "paid_ended"
  | "paid_dropped"
  /** Sent by the Whop webhook when the buyer schedules a cancellation. */
  | "paid_canceled";

export type NoticeSubscription = {
  plan: PlanId;
  status: "trialing" | "active" | "past_due" | "canceled" | "expired";
  trial_ends_at: string | null;
  current_period_end: string | null;
  /** "whop" for plans paid online; anything else was paid by hand. */
  provider?: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days left until `end`, rounded up (3 hours left counts as 1 day). */
export function daysUntil(end: Date, now: Date): number {
  return Math.ceil((end.getTime() - now.getTime()) / DAY_MS);
}

/**
 * The reminder a subscription is due for today, if any. Lapsed plans are not
 * handled here: the expiry step reports them (trial_ended / paid_dropped).
 */
export function dueNotice(
  sub: NoticeSubscription,
  now: Date = new Date(),
): { kind: NoticeKind; periodEnd: Date; daysLeft: number } | null {
  if (sub.plan === "free") return null;

  if (sub.status === "trialing" && sub.trial_ends_at) {
    const end = new Date(sub.trial_ends_at);
    const left = daysUntil(end, now);
    if (left <= 0) return null;
    if (left <= 3) return { kind: "trial_3d", periodEnd: end, daysLeft: left };
    if (left <= 7) return { kind: "trial_7d", periodEnd: end, daysLeft: left };
    return null;
  }

  // Whop renews active plans on its own (a failed charge turns them past_due), so
  // a "your plan expires" reminder would be wrong. Canceled ones do get it.
  if (sub.provider === "whop" && sub.status === "active") return null;

  if (
    (sub.status === "active" || sub.status === "canceled") &&
    sub.current_period_end
  ) {
    const end = new Date(sub.current_period_end);
    const left = daysUntil(end, now);
    if (left > 0 && left <= 7) {
      return { kind: "paid_7d", periodEnd: end, daysLeft: left };
    }
    // Ended but still inside the 7-day grace (only active plans get one).
    if (left <= 0 && sub.status === "active" && left > -7) {
      return { kind: "paid_ended", periodEnd: end, daysLeft: left };
    }
  }
  return null;
}

/** Notice for a plan the expiry step just dropped to Free. */
export function droppedNotice(
  previousStatus: NoticeSubscription["status"],
): NoticeKind {
  return previousStatus === "trialing" ? "trial_ended" : "paid_dropped";
}

export type NoticeEmail = { subject: string; html: string; text: string };

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const longDate = new Intl.DateTimeFormat("es-CR", {
  dateStyle: "long",
  timeZone: "America/Costa_Rica",
});

/** Same look as supabase/templates/confirmation.html. */
function layout(input: {
  heading: string;
  paragraphs: string[];
  cta: { label: string; url: string };
  footnote: string;
}): string {
  const body = input.paragraphs
    .map(
      (p) =>
        `<p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">${escapeHtml(p)}</p>`,
    )
    .join("");
  return `<div style="font-family: Arial, Helvetica, sans-serif; background: #fff8ee; padding: 32px 16px;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; color: #35352d;">
    <h1 style="font-size: 22px; margin: 0 0 16px;">${escapeHtml(input.heading)}</h1>
    ${body}
    <p style="margin: 8px 0 24px;">
      <a href="${escapeHtml(input.cta.url)}" style="display: inline-block; background: #d4a862; color: #35352d; text-decoration: none; font-weight: bold; padding: 14px 28px; border-radius: 999px;">${escapeHtml(input.cta.label)}</a>
    </p>
    <p style="font-size: 13px; line-height: 1.6; color: #6b6b60; margin: 0;">${escapeHtml(input.footnote)}</p>
  </div>
</div>`;
}

export function noticeEmail(
  kind: NoticeKind,
  input: {
    name: string | null;
    plan: PlanId;
    periodEnd: Date;
    daysLeft: number;
    siteUrl: string;
    /** Paid online (Whop): renewing is done from the panel, not by writing to us. */
    selfServe?: boolean;
  },
): NoticeEmail {
  const hello = input.name?.trim()
    ? `Hola, ${input.name.trim().split(/\s+/)[0]}:`
    : "Hola:";
  const plan = getPlan(input.plan)?.name ?? "tu plan";
  const date = longDate.format(input.periodEnd);
  const days = input.daysLeft === 1 ? "1 día" : `${input.daysLeft} días`;
  const planUrl = `${input.siteUrl}/panel/configuracion#suscripcion`;
  const plansUrl = `${input.siteUrl}/panel/configuracion#planes`;
  const keepsWorking =
    "Tu guía y tu código QR siguen funcionando: la cuenta pasa a la versión básica, con 1 alojamiento activo y 5 servicios. Nada se borra.";
  const footnote =
    "Recibes este correo porque tienes una cuenta en emblemático. Si tienes dudas, escríbenos desde la página de contacto del sitio.";

  let content: {
    subject: string;
    heading: string;
    paragraphs: string[];
    cta: { label: string; url: string };
  };
  switch (kind) {
    case "trial_7d":
    case "trial_3d":
      content = {
        subject: `Te quedan ${days} de prueba en emblemático`,
        heading: `Te quedan ${days} de prueba`,
        paragraphs: [
          hello,
          `Tu prueba gratuita de ${plan} termina el ${date}.`,
          `Si quieres seguir con todo lo que incluye, continúa con ${plan}. Si no, no tienes que hacer nada. ${keepsWorking}`,
        ],
        cta: { label: `Continuar con ${plan}`, url: planUrl },
      };
      break;
    case "trial_ended":
      content = {
        subject: "Tu prueba de emblemático terminó",
        heading: "Tu prueba terminó",
        paragraphs: [
          hello,
          `Tu prueba gratuita de ${plan} terminó el ${date}.`,
          keepsWorking,
          `Cuando quieras volver a ${plan}, puedes hacerlo desde tu panel.`,
        ],
        cta: { label: "Ver planes", url: plansUrl },
      };
      break;
    case "paid_7d":
      content = {
        subject: `Tu plan ${plan} vence el ${date}`,
        heading: `Tu plan vence en ${days}`,
        paragraphs: [
          hello,
          input.selfServe
            ? `Tu plan ${plan} vence el ${date} y no se renovará porque lo cancelaste. Si quieres mantenerlo, reactívalo desde tu panel antes de esa fecha.`
            : `Tu plan ${plan} vence el ${date}. Para renovarlo, escríbenos y coordinamos el pago (tarjeta o SINPE Móvil).`,
          `Si no lo renuevas, ${keepsWorking.charAt(0).toLowerCase()}${keepsWorking.slice(1)}`,
        ],
        cta: { label: "Renovar mi plan", url: planUrl },
      };
      break;
    case "paid_ended":
      content = {
        subject: `Tu plan ${plan} venció`,
        heading: "Tu plan venció",
        paragraphs: [
          hello,
          `Tu plan ${plan} venció el ${date}. Lo mantenemos activo 7 días más para que puedas renovarlo sin cambios.`,
          `Después de esos días, ${keepsWorking.charAt(0).toLowerCase()}${keepsWorking.slice(1)}`,
        ],
        cta: { label: "Renovar mi plan", url: planUrl },
      };
      break;
    case "paid_dropped":
      content = {
        subject: "Tu cuenta de emblemático pasó a la versión básica",
        heading: "Tu cuenta pasó a la versión básica",
        paragraphs: [
          hello,
          `Tu plan ${plan} venció y no se renovó.`,
          keepsWorking,
          `Cuando quieras volver a ${plan}, puedes hacerlo desde tu panel.`,
        ],
        cta: { label: "Ver planes", url: plansUrl },
      };
      break;
    case "paid_canceled":
      content = {
        subject: `Cancelaste tu plan ${plan} de emblemático`,
        heading: "Tu plan no se renovará",
        paragraphs: [
          hello,
          `Recibimos la cancelación de tu plan ${plan}. Lo sigues teniendo completo hasta el ${date} y no se te volverá a cobrar.`,
          `Después de esa fecha, ${keepsWorking.charAt(0).toLowerCase()}${keepsWorking.slice(1)}`,
          "Si cambias de opinión, puedes reactivarlo desde tu panel antes de esa fecha.",
        ],
        cta: { label: "Ver mi plan", url: planUrl },
      };
      break;
  }

  const text = [
    ...content.paragraphs,
    `${content.cta.label}: ${content.cta.url}`,
    footnote,
  ].join("\n\n");
  return {
    subject: content.subject,
    html: layout({ ...content, footnote }),
    text,
  };
}
