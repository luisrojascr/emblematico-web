"use client";

import Link from "next/link";
import { useState } from "react";

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

/** Lista de "Cambiar de plan" con selector Anual/Mensual (anual por defecto). */
export function PlanChangeList({ currentPlanId }: { currentPlanId: PlanId }) {
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
        {/* Free no se elige: es a lo que baja una cuenta que no paga. */}
        {PLANS.filter((p) => SITE_PLAN_IDS.includes(p.id)).map((option) => {
          const current = option.id === currentPlanId;
          const monthly =
            billing === "monthly" && option.monthlyPrice !== undefined;
          const savings = annualSavings(option);
          const href = current
            ? "#suscripcion"
            : option.price
              ? `/contacto?plan=${option.id}&periodo=${billing === "monthly" ? "mensual" : "anual"}`
              : `/contacto?plan=${option.id}`;
          return (
            <li key={option.id}>
              <Link
                href={href}
                aria-current={current ? "true" : undefined}
                className="hover:bg-cream/60 flex items-center gap-4 p-5 transition-colors"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    {t(option.name)}
                    {current ? (
                      <span className="text-teal-deep text-xs font-bold">
                        {t("Tu plan")}
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
                  ›
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
