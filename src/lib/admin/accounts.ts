import { z } from "zod";

import { PLAN_IDS, getPlan, type PlanId } from "@/lib/plans";

/**
 * Admin account management (phase 4 of self-serve signup). Pure helpers and form
 * schemas; database access lives in accounts-data.ts and the server actions.
 */

/** Prefix on businesses.suspended_reason for guides suspended with their account. */
export const ACCOUNT_SUSPENSION_PREFIX = "Cuenta suspendida: ";

/** "Ban forever" for Supabase Auth: about 100 years. */
export const ACCOUNT_BAN_DURATION = "876000h";

/** Provider name for plan changes made by hand in the admin (billing_events). */
export const MANUAL_PROVIDER = "manual";

export const TRIAL_EXTENSIONS = [7, 15, 30] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export type SubscriptionRow = {
  plan: PlanId;
  status: "trialing" | "active" | "past_due" | "canceled" | "expired";
  billing_period: "monthly" | "annual" | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  extra_properties: number;
  property_limit_override: number | null;
};

export type AccountTone = "ok" | "trial" | "warn" | "muted";

/**
 * One-line state for the admin list. Mirrors effective_plan(): trials and paid
 * periods that ended count as Free even before the daily job stores it.
 */
export function accountState(
  sub: SubscriptionRow | null,
  now: Date = new Date(),
  locale = "es-CR",
): { label: string; tone: AccountTone; effectivePlan: PlanId } {
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      new Date(value),
    );
  if (!sub)
    return { label: "Sin suscripción", tone: "muted", effectivePlan: "free" };

  if (sub.status === "trialing") {
    const left = sub.trial_ends_at
      ? new Date(sub.trial_ends_at).getTime() - now.getTime()
      : 0;
    if (left > 0 && sub.plan !== "free") {
      const days = Math.max(1, Math.ceil(left / DAY_MS));
      return {
        label: `En prueba: ${days === 1 ? "queda 1 día" : `quedan ${days} días`}`,
        tone: days <= 7 ? "warn" : "trial",
        effectivePlan: sub.plan,
      };
    }
    return { label: "Prueba vencida", tone: "muted", effectivePlan: "free" };
  }

  const end = sub.current_period_end ? new Date(sub.current_period_end) : null;
  const grace = end ? new Date(end.getTime() + 7 * DAY_MS) : null;
  if (sub.plan === "free") {
    return {
      label: sub.status === "expired" ? "Free (venció)" : "Free",
      tone: "muted",
      effectivePlan: "free",
    };
  }
  if (sub.status === "active") {
    if (!end)
      return {
        label: "Activa, sin vencimiento",
        tone: "ok",
        effectivePlan: sub.plan,
      };
    if (end > now)
      return {
        label: `Activa hasta ${date(sub.current_period_end!)}`,
        tone: "ok",
        effectivePlan: sub.plan,
      };
    if (grace && grace > now)
      return {
        label: `Venció el ${date(sub.current_period_end!)} (en gracia)`,
        tone: "warn",
        effectivePlan: sub.plan,
      };
    return { label: "Vencida", tone: "muted", effectivePlan: "free" };
  }
  if (sub.status === "past_due") {
    return grace && grace > now
      ? { label: "Pago pendiente", tone: "warn", effectivePlan: sub.plan }
      : {
          label: "Pago pendiente (ya en Free)",
          tone: "muted",
          effectivePlan: "free",
        };
  }
  if (sub.status === "canceled") {
    return end && end > now
      ? {
          label: `Cancelada, activa hasta ${date(sub.current_period_end!)}`,
          tone: "warn",
          effectivePlan: sub.plan,
        }
      : { label: "Cancelada", tone: "muted", effectivePlan: "free" };
  }
  return { label: "Vencida", tone: "muted", effectivePlan: "free" };
}

/** Managers without an admin-set cap (property_limit() returns 1000). */
const MANAGERS_DEFAULT_LIMIT = 1000;

/** Same rule as property_limit() in the subscriptions migration, from plans.ts. */
export function propertyLimitFor(
  plan: PlanId,
  sub: Pick<
    SubscriptionRow,
    "extra_properties" | "property_limit_override"
  > | null,
): number {
  const extras = sub?.extra_properties ?? 0;
  const config = getPlan(plan);
  if (plan === "managers") {
    return sub?.property_limit_override ?? MANAGERS_DEFAULT_LIMIT;
  }
  const included = config?.properties ?? 1;
  if (plan === "free") return included;
  const total = included + extras;
  return config?.maxProperties !== undefined
    ? Math.min(total, config.maxProperties)
    : total;
}

export function planName(id: PlanId): string {
  return getPlan(id)?.name ?? id;
}

/** Default end of a period paid by hand: one year (annual) or one month. */
export function defaultPeriodEnd(
  period: "monthly" | "annual",
  from: Date = new Date(),
): Date {
  const end = new Date(from);
  if (period === "annual") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

/**
 * yyyy-mm-dd for <input type="date">, as a Costa Rica calendar day. Expiries are
 * stored as the end of that day in Costa Rica (see manualSubscription), which is
 * already the next day in UTC, so a UTC slice would move the date forward.
 */
export function dateInputValue(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * New trial end when the admin extends a trial: from the current end if the trial
 * is still running, otherwise from now (a lapsed trial restarts).
 */
export function extendedTrialEnd(
  currentEnd: string | null,
  days: number,
  now: Date = new Date(),
): Date {
  const current = currentEnd ? new Date(currentEnd) : null;
  const base = current && current > now ? current : now;
  return new Date(base.getTime() + days * DAY_MS);
}

const userId = z.uuid("Cuenta no válida.");

export const setPlanSchema = z
  .object({
    userId,
    plan: z.enum(PLAN_IDS, "Elige un plan."),
    period: z.enum(["monthly", "annual"]).nullable(),
    periodEnd: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Elige la fecha de vencimiento.")
      .nullable(),
    extraProperties: z.coerce
      .number()
      .int("Usa un número entero.")
      .min(0, "No puede ser negativo.")
      .max(1000, "Máximo 1000."),
    limitOverride: z.coerce
      .number()
      .int("Usa un número entero.")
      .min(1, "Mínimo 1.")
      .max(100000, "Máximo 100000.")
      .nullable(),
    note: z.string().trim().max(300, "Máximo 300 caracteres"),
  })
  .superRefine((value, ctx) => {
    if (value.plan === "free") return;
    if (value.plan !== "managers" && !value.period) {
      ctx.addIssue({
        code: "custom",
        path: ["period"],
        message: "Elige el periodo.",
      });
    }
    if (!value.periodEnd) {
      ctx.addIssue({
        code: "custom",
        path: ["periodEnd"],
        message: "Elige la fecha de vencimiento.",
      });
    }
  });

export type SetPlanInput = z.infer<typeof setPlanSchema>;

/** Subscription columns for a plan set by hand. Free clears every paid field. */
export function manualSubscription(input: SetPlanInput): {
  plan: PlanId;
  status: "active";
  billing_period: "monthly" | "annual" | null;
  current_period_end: string | null;
  extra_properties: number;
  property_limit_override: number | null;
} {
  if (input.plan === "free") {
    return {
      plan: "free",
      status: "active",
      billing_period: null,
      current_period_end: null,
      extra_properties: 0,
      property_limit_override: null,
    };
  }
  return {
    plan: input.plan,
    status: "active",
    billing_period:
      input.plan === "managers" ? (input.period ?? "annual") : input.period,
    // End of the chosen day in Costa Rica (UTC-6), so the plan lasts the whole day.
    current_period_end: input.periodEnd
      ? new Date(`${input.periodEnd}T23:59:59-06:00`).toISOString()
      : null,
    extra_properties: input.extraProperties,
    property_limit_override:
      input.plan === "managers" ? input.limitOverride : null,
  };
}

export const extendTrialSchema = z.object({
  userId,
  days: z.coerce
    .number()
    .refine(
      (days) => (TRIAL_EXTENSIONS as readonly number[]).includes(days),
      "Elige cuántos días.",
    ),
});

export const accountReasonSchema = z.object({
  userId,
  reason: z
    .string()
    .trim()
    .min(5, "Escribe el motivo (mínimo 5 caracteres).")
    .max(400, "Máximo 400 caracteres"),
});

export const ACCOUNT_FILTERS = {
  todas: "Todas",
  prueba: "En prueba",
  vence: "Vence en 7 días",
  pago: "De pago",
  free: "Free",
  bloqueadas: "Bloqueadas",
} as const;
export type AccountFilter = keyof typeof ACCOUNT_FILTERS;

export function accountFilter(value: unknown): AccountFilter {
  return typeof value === "string" && value in ACCOUNT_FILTERS
    ? (value as AccountFilter)
    : "todas";
}

export type AccountSummary = {
  email: string | null;
  fullName: string | null;
  role: "admin" | "client";
  blocked: boolean;
  sub: SubscriptionRow | null;
};

export function matchesAccount(
  account: AccountSummary,
  filter: AccountFilter,
  search: string,
  now: Date = new Date(),
): boolean {
  const q = search.trim().toLowerCase();
  if (
    q &&
    !(account.email ?? "").toLowerCase().includes(q) &&
    !(account.fullName ?? "").toLowerCase().includes(q)
  ) {
    return false;
  }
  if (filter === "todas") return true;
  if (filter === "bloqueadas") return account.blocked;
  const state = accountState(account.sub, now);
  const sub = account.sub;
  switch (filter) {
    case "prueba":
      return sub?.status === "trialing" && state.effectivePlan !== "free";
    case "vence": {
      const end =
        sub?.status === "trialing"
          ? sub.trial_ends_at
          : sub?.current_period_end;
      if (!end || state.effectivePlan === "free") return false;
      const left = new Date(end).getTime() - now.getTime();
      return left > 0 && left <= 7 * DAY_MS;
    }
    case "pago":
      return sub?.status !== "trialing" && state.effectivePlan !== "free";
    case "free":
      return account.role !== "admin" && state.effectivePlan === "free";
  }
}
