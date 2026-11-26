"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { startCheckout } from "@/app/(panel)/panel/configuracion/billing-actions";
import { usePanelI18n } from "@/components/panel/PanelLanguageProvider";
import { panelCardClass } from "@/components/panel/ui";
import {
  BILLING_LABELS,
  BILLING_PERIODS,
  DEFAULT_BILLING,
  PLANS,
  SITE_PLAN_IDS,
  type BillingPeriod,
  type PlanId,
  annualSavings,
  formatUsd,
  maxAnnualSavingsPercent,
} from "@/lib/plans";

const ROW_CLASS =
  "hover:bg-cream/60 flex w-full items-center gap-4 p-5 text-left transition-colors disabled:cursor-wait disabled:opacity-60";

/** A plan row that submits the checkout form it sits in. */
function CheckoutRow({
  children,
  current,
}: {
  children: ReactNode;
  current: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      aria-current={current ? "true" : undefined}
      className={ROW_CLASS}
    >
      {children}
    </button>
  );
}

/**
 * "Change plan" list with an annual/monthly toggle (annual by default). During a
 * trial the current plan stays clickable, since continuing with it means paying.
 * With `checkout`, paid plans open Whop's checkout; otherwise they go to the
 * contact form, as before online payment existed.
 */
export function PlanChangeList({
  currentPlanId,
  trialing = false,
  checkout = false,
}: {
  currentPlanId: PlanId;
  trialing?: boolean;
  checkout?: boolean;
}) {
  const { t } = usePanelI18n();
  const [billing, setBilling] = useState<BillingPeriod>(DEFAULT_BILLING);

  return (
    <>
      <div
        role="radiogroup"
        aria-label={t("Periodo de facturación")}
        className="border-cream-dark mb-4 inline-flex rounded-full border bg-white p-1"
      >
        {BILLING_PERIODS.map((b) => {
          const active = b === billing;
          return (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setBilling(b)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                active ? "bg-sand text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              {t(BILLING_LABELS[b])}
              {b === "annual" && (
                <span className="text-teal-deep ml-2 text-[11px] font-bold">
                  {t("Ahorra hasta")} {maxAnnualSavingsPercent()}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      <ul className={`${panelCardClass} divide-cream-dark divide-y`}>
        {/* Free is never picked: it is what an unpaid account drops to. */}
        {PLANS.filter((p) => SITE_PLAN_IDS.includes(p.id)).map((option) => {
          const current = option.id === currentPlanId;
          const monthly =
            billing === "monthly" && option.monthlyPrice !== undefined;
          const savings = annualSavings(option);
          const toCurrent = current && !trialing;
          const sellsOnline =
            checkout && !toCurrent && option.id === "essential";
          const href = toCurrent
            ? "#suscripcion"
            : option.price
              ? `/contacto?plan=${option.id}&periodo=${billing === "monthly" ? "mensual" : "anual"}`
              : `/contacto?plan=${option.id}`;
          // A quote (Managers) opens the contact form in a new tab so the panel stays open.
          const newTab = !toCurrent && option.price === null;
          return (
            <li key={option.id}>
              <RowShell
                checkoutPlan={sellsOnline ? option.id : null}
                billing={billing}
                href={href}
                current={current}
                newTab={newTab}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    {t(option.name)}
                    {current ? (
                      <span className="text-teal-deep text-xs font-bold">
                        {t(trialing ? "En prueba" : "Tu plan")}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-ink-soft block text-sm">
                    {t(option.summary)}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-bold">
                    {option.price === null
                      ? t("Cotiza")
                      : formatUsd(
                          monthly ? option.monthlyPrice! : option.price,
                        )}
                  </span>
                  {option.price ? (
                    <span className="text-ink-soft block text-xs">
                      {monthly ? t("al mes") : t("al año")}
                    </span>
                  ) : null}
                  {option.price && savings ? (
                    <span className="text-teal-deep block text-xs font-medium">
                      {monthly
                        ? `${t("Anual")}: ${formatUsd(option.price)}`
                        : `${t("Ahorras")} ${formatUsd(savings)}`}
                    </span>
                  ) : null}
                </span>
                <span aria-hidden="true" className="text-ink-soft">
                  {newTab ? "↗" : "›"}
                </span>
              </RowShell>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** A form posting to the checkout when the plan is sold online, else a link. */
function RowShell({
  checkoutPlan,
  billing,
  href,
  current,
  newTab,
  children,
}: {
  checkoutPlan: PlanId | null;
  billing: BillingPeriod;
  href: string;
  current: boolean;
  newTab: boolean;
  children: ReactNode;
}) {
  if (checkoutPlan) {
    return (
      <form action={startCheckout}>
        <input type="hidden" name="plan" value={checkoutPlan} />
        <input type="hidden" name="billing" value={billing} />
        <CheckoutRow current={current}>{children}</CheckoutRow>
      </form>
    );
  }
  return (
    <Link
      href={href}
      aria-current={current ? "true" : undefined}
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={ROW_CLASS}
    >
      {children}
    </Link>
  );
}
