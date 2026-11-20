"use client";

import Image from "next/image";
import { useState } from "react";

import { PlanFeatureItem } from "@/components/marketing/PlanFeatureItem";
import { SquareLink } from "@/components/ui/SquareButton";
import {
  BILLING_LABELS,
  BILLING_PERIODS,
  CURRENCY_NOTE,
  DEFAULT_BILLING,
  type BillingPeriod,
  annualSavings,
  featureLabel,
  firstChargeTotal,
  maxAnnualSavingsPercent,
  MAX_PIECES_ONLINE,
  PIECE_TIERS,
  PLANS,
  SHOW_PRICES,
  SITE_PLAN_IDS,
  TRIAL_DAYS,
  TRIAL_GUARANTEE,
  WELCOME_PIECE,
  type Plan,
  formatUsd,
  pieceUnitPrice,
} from "@/lib/plans";

const stepButton =
  "border-cream-dark hover:border-ink flex h-9 w-9 items-center justify-center rounded-[4px] border bg-white text-lg leading-none disabled:opacity-40";

function piecesLabel(quantity: number): string {
  if (quantity > MAX_PIECES_ONLINE) return `Más de ${MAX_PIECES_ONLINE}`;
  return quantity === 1 ? "1 pieza" : `${quantity} piezas`;
}

function PieceSelector({
  planId,
  quantity,
  onChange,
}: {
  planId: string;
  quantity: number;
  onChange: (n: number) => void;
}) {
  const labelId = `piezas-${planId}`;
  const unit = pieceUnitPrice(quantity);
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        quantity > 0 ? "border-sand bg-cream" : "border-cream-dark bg-white"
      }`}
    >
      <div className="flex items-start gap-4">
        <Image
          src="/images/welcome-piece.webp"
          alt="Ejemplo de pieza de bienvenida 3D con logo y código QR"
          width={112}
          height={112}
          className="border-cream-dark h-24 w-24 shrink-0 rounded-lg border object-cover sm:h-28 sm:w-28"
        />
        <div className="min-w-0 space-y-1">
          <p className="text-sand-dark text-[11px] font-semibold tracking-[0.08em] uppercase">
            Extra recomendado
          </p>
          <p id={labelId} className="text-sm leading-snug font-semibold">
            Agregar {WELCOME_PIECE.inlineName}
          </p>
          <p className="text-ink-soft text-xs leading-snug">
            {WELCOME_PIECE.description}
          </p>
        </div>
      </div>
      <div
        role="group"
        aria-labelledby={labelId}
        className="mt-4 flex items-center gap-3"
      >
        <button
          type="button"
          className={stepButton}
          onClick={() => onChange(Math.max(0, quantity - 1))}
          disabled={quantity === 0}
          aria-label="Quitar una pieza"
        >
          −
        </button>
        <output
          aria-live="polite"
          className="w-24 text-center text-sm whitespace-nowrap"
        >
          {piecesLabel(quantity)}
        </output>
        <button
          type="button"
          className={stepButton}
          onClick={() =>
            onChange(Math.min(MAX_PIECES_ONLINE + 1, quantity + 1))
          }
          disabled={quantity > MAX_PIECES_ONLINE}
          aria-label="Agregar una pieza"
        >
          +
        </button>
        {SHOW_PRICES && (
          <span className="text-ink-soft ml-auto text-xs whitespace-nowrap">
            {quantity > 0 && unit !== null
              ? `${formatUsd(unit)} c/u`
              : quantity === 0
                ? `Desde ${formatUsd(PIECE_TIERS[PIECE_TIERS.length - 1].unit)} c/u`
                : "Cotización"}
          </span>
        )}
      </div>
    </div>
  );
}

function BillingToggle({
  value,
  onChange,
}: {
  value: BillingPeriod;
  onChange: (b: BillingPeriod) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Periodo de facturación"
        className="border-cream-dark inline-flex rounded-full border bg-white p-1"
      >
        {BILLING_PERIODS.map((b) => {
          const active = b === value;
          return (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(b)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-sand text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              {BILLING_LABELS[b]}
              {b === "annual" && (
                <span
                  className={`ml-2 text-[11px] font-bold ${
                    // Teal on the gold pill fails contrast (2.7:1); ink passes.
                    active ? "text-ink" : "text-teal-deep"
                  }`}
                >
                  Ahorra hasta {maxAnnualSavingsPercent()}%
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-ink-soft text-sm" aria-live="polite">
        {value === "annual"
          ? "Pagando por año ahorras frente a 12 pagos mensuales."
          : "Pago mes a mes. Pagando por año ahorras hasta " +
            maxAnnualSavingsPercent() +
            "%."}
      </p>
    </div>
  );
}

function PlanPrice({ plan, billing }: { plan: Plan; billing: BillingPeriod }) {
  if (plan.price === 0)
    return (
      <>
        {formatUsd(0)}
        <span className="text-ink-soft ml-2 font-sans text-sm">Sin costo</span>
      </>
    );
  if (!SHOW_PRICES || plan.price === null) return <>Cotiza</>;
  const monthly = billing === "monthly" && plan.monthlyPrice !== undefined;
  const savings = annualSavings(plan);
  return (
    <>
      {formatUsd(monthly ? plan.monthlyPrice! : plan.price)}
      <span className="text-ink-soft ml-1 font-sans text-sm">
        {monthly ? "/mes" : "/año"}
      </span>
      {!monthly && savings ? (
        <span className="bg-sand/25 text-ink ml-2 inline-block rounded-[4px] px-2 py-0.5 align-middle font-sans text-[11px] font-semibold">
          Ahorras {formatUsd(savings)}
        </span>
      ) : null}
    </>
  );
}

function totalText(plan: Plan, pieces: number, billing: BillingPeriod): string {
  if (pieces === 0 || !SHOW_PRICES) return "";
  const total = firstChargeTotal(plan, pieces, billing);
  if (total === null) return "Te enviamos una cotización por las piezas.";
  if (plan.price === 0) return `Total: ${formatUsd(total)}, pago único`;
  return billing === "monthly"
    ? `Primer cobro: ${formatUsd(total)} (primer mes + piezas)`
    : `Total el primer año: ${formatUsd(total)}`;
}

/** Línea bajo el precio: equivalente mensual (anual) o lo que se ahorra pagando anual (mensual). */
function billingNote(plan: Plan, billing: BillingPeriod): string {
  const savings = annualSavings(plan);
  if (!SHOW_PRICES || !plan.price || !plan.monthlyPrice || !savings) return "";
  return billing === "annual"
    ? `Equivale a ${formatUsd(Math.round((plan.price / 12) * 100) / 100)}/mes · en lugar de ${formatUsd(plan.monthlyPrice * 12)} al pagar mensual`
    : `Pagando anual: ${formatUsd(plan.price)}/año, ahorras ${formatUsd(savings)}`;
}

function extraLimitText(plan: Plan): string {
  return plan.maxProperties ? `(hasta ${plan.maxProperties})` : "(sin límite)";
}

function PlanCard({ plan, billing }: { plan: Plan; billing: BillingPeriod }) {
  const [pieces, setPieces] = useState(0);
  const isFree = plan.id === "free";
  const params = new URLSearchParams({ plan: plan.id });
  if (plan.price)
    params.set("periodo", billing === "monthly" ? "mensual" : "anual");
  if (pieces > 0) params.set("piezas", String(pieces));
  // Plans with a free trial start with self-service signup; the rest still go through the quote form.
  const href = plan.trial
    ? `/registro?periodo=${billing === "monthly" ? "mensual" : "anual"}`
    : `/contacto?${params.toString()}`;

  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-white p-6 sm:p-8 ${
        plan.highlighted
          ? "border-sand border-2 shadow-lg"
          : "border-cream-dark"
      }`}
    >
      <h3 className="text-2xl">{plan.name}</h3>
      <p className="text-ink-soft mt-2 text-sm lg:min-h-10">{plan.summary}</p>
      <p className="mt-6 font-serif text-4xl">
        <PlanPrice plan={plan} billing={billing} />
      </p>
      {/* Misma altura en todas las tarjetas, haya o no nota de facturación. */}
      <p className="text-teal-deep mt-1 min-h-4 text-xs font-medium">
        {billingNote(plan, billing)}
      </p>
      <p className="text-ink-soft mt-1 min-h-4 text-xs">
        {SHOW_PRICES && plan.extraProperty
          ? billing === "monthly" && plan.extraPropertyMonthly
            ? `Alojamiento adicional: +$${plan.extraPropertyMonthly.toFixed(2)}/mes ${extraLimitText(plan)}`
            : `Alojamiento adicional: +${formatUsd(plan.extraProperty)}/año ${extraLimitText(plan)}`
          : ""}
      </p>
      <ul className="text-ink-soft mt-6 mb-6 flex-1 space-y-2 text-sm">
        {plan.includes.map((feature) => (
          <PlanFeatureItem key={featureLabel(feature)} feature={feature} />
        ))}
      </ul>

      <PieceSelector planId={plan.id} quantity={pieces} onChange={setPieces} />
      <p
        className="text-ink-soft mt-3 min-h-5 text-sm font-medium"
        aria-live="polite"
      >
        {totalText(plan, pieces, billing)}
      </p>

      <SquareLink
        href={href}
        variant={isFree ? "outline" : "primary"}
        className="mt-4"
      >
        {isFree
          ? "Comenzar gratis"
          : plan.trial
            ? `Empieza ${TRIAL_DAYS} días gratis`
            : `Comprar ${plan.name.replace("Hospitality ", "")}`}
      </SquareLink>
      {/* Misma altura en todas las tarjetas, tenga o no prueba. */}
      <p className="text-ink-soft mt-2 min-h-5 text-center text-xs">
        {plan.trial ? `Prueba gratis de ${TRIAL_DAYS} días · sin tarjeta` : ""}
      </p>
    </article>
  );
}

/** Plan para administradores: misma tarjeta que los demás, con precio a la medida. */
function ManagersCard({ plan }: { plan: Plan }) {
  return (
    <article className="border-cream-dark relative flex flex-col rounded-2xl border bg-white p-6 sm:p-8">
      <h3 className="text-2xl">{plan.name}</h3>
      <p className="text-ink-soft mt-2 text-sm lg:min-h-10">{plan.summary}</p>
      <p className="mt-6 font-serif text-4xl">A la medida</p>
      {/* Mismas dos líneas que las otras tarjetas para alinear las listas. */}
      <p className="text-teal-deep mt-1 min-h-4 text-xs font-medium">
        Cotización según tu cartera
      </p>
      <p className="mt-1 min-h-4 text-xs" />
      <ul className="text-ink-soft mt-6 mb-6 flex-1 space-y-2 text-sm">
        {plan.includes.map((feature) => (
          <PlanFeatureItem key={featureLabel(feature)} feature={feature} />
        ))}
      </ul>
      <SquareLink
        href={`/contacto?plan=${plan.id}`}
        variant="outline"
        className="mt-4"
      >
        Solicitar cotización
      </SquareLink>
      <p className="mt-2 min-h-5 text-xs" />
    </article>
  );
}

export function PlanCards() {
  const shown = PLANS.filter((p) => SITE_PLAN_IDS.includes(p.id));
  const [billing, setBilling] = useState<BillingPeriod>(DEFAULT_BILLING);
  return (
    <div className="space-y-6">
      {SHOW_PRICES && <BillingToggle value={billing} onChange={setBilling} />}
      <div className="grid gap-6 lg:grid-cols-3">
        {shown.map((plan) =>
          plan.price === null ? (
            <ManagersCard key={plan.id} plan={plan} />
          ) : (
            <PlanCard key={plan.id} plan={plan} billing={billing} />
          ),
        )}
      </div>
      <p className="border-cream-dark text-teal-deep rounded-xl border bg-white px-5 py-4 text-center text-sm font-medium">
        {TRIAL_GUARANTEE}
      </p>
      {SHOW_PRICES && (
        <div className="text-ink-soft space-y-1 pt-2 text-sm">
          <p>
            {WELCOME_PIECE.name}:{" "}
            {PIECE_TIERS.map(
              (t) => `${formatUsd(t.unit)} c/u (${t.min}–${t.max})`,
            ).join(", ")}
            ; más de {MAX_PIECES_ONLINE}, por cotización. El envío se cobra
            aparte.
          </p>
          <p>{CURRENCY_NOTE}</p>
        </div>
      )}
    </div>
  );
}
