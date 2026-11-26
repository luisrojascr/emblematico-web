"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { PlanFeatureItem } from "@/components/marketing/PlanFeatureItem";
import { SquareDisabled, SquareLink } from "@/components/ui/SquareButton";
import {
  BILLING_LABELS,
  BILLING_PERIODS,
  CURRENCY_NOTE,
  DEFAULT_BILLING,
  type BillingPeriod,
  annualSavings,
  featureLabel,
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
import { SIGNUP_OPEN } from "@/lib/site";

const stepButton =
  "border-cream-dark hover:border-ink flex h-9 w-9 items-center justify-center rounded-[4px] border bg-white text-lg leading-none disabled:opacity-40";

function piecesLabel(quantity: number): string {
  if (quantity > MAX_PIECES_ONLINE) return `Más de ${MAX_PIECES_ONLINE}`;
  return quantity === 1 ? "1 pieza" : `${quantity} piezas`;
}

function PieceStepper({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (n: number) => void;
}) {
  const unit = pieceUnitPrice(quantity);
  return (
    <div
      role="group"
      aria-label="Cantidad de piezas"
      className="flex items-center gap-3"
    >
      <button
        type="button"
        className={stepButton}
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
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
        onClick={() => onChange(Math.min(MAX_PIECES_ONLINE + 1, quantity + 1))}
        disabled={quantity > MAX_PIECES_ONLINE}
        aria-label="Agregar una pieza"
      >
        +
      </button>
      {SHOW_PRICES && (
        <span className="text-ink-soft text-xs whitespace-nowrap">
          {unit !== null ? `${formatUsd(unit)} c/u` : "Cotización"}
        </span>
      )}
    </div>
  );
}

/**
 * The welcome piece on its own, below the plans. It used to sit inside the plan card,
 * but the plan now starts as a free trial without a card, so the pieces never reached
 * the signup. Here it is a separate, one-time order through the contact form.
 */
function WelcomePieceOffer() {
  const [pieces, setPieces] = useState(1);
  return (
    <section
      aria-labelledby="pieza-bienvenida"
      className="border-cream-dark mx-auto max-w-4xl rounded-2xl border bg-white p-6 sm:p-8"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Image
          src="/images/welcome-piece.webp"
          alt="Ejemplo de pieza de bienvenida 3D con logo y código QR"
          width={176}
          height={176}
          className="border-cream-dark h-40 w-40 shrink-0 rounded-xl border object-cover sm:h-44 sm:w-44"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sand-dark text-[11px] font-semibold tracking-[0.08em] uppercase">
            Opcional · pago único
          </p>
          <h3 id="pieza-bienvenida" className="text-2xl">
            {WELCOME_PIECE.name}
          </h3>
          <p className="text-ink-soft text-sm">
            Pieza personalizada impresa en 3D con el código QR de tu guía, para
            la recepción o la habitación. Funciona con cualquier plan, también
            durante la prueba gratis.
          </p>
          {SHOW_PRICES && (
            <p className="text-ink-soft text-xs">
              {PIECE_TIERS.map(
                (t) => `${formatUsd(t.unit)} c/u (${t.min}–${t.max})`,
              ).join(", ")}
              ; más de {MAX_PIECES_ONLINE}, por cotización. El envío se cobra
              aparte.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <PieceStepper quantity={pieces} onChange={setPieces} />
            <SquareLink href={`/contacto?piezas=${pieces}`} variant="outline">
              Pedir piezas
            </SquareLink>
          </div>
        </div>
      </div>
    </section>
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
  const isFree = plan.id === "free";
  const params = new URLSearchParams({ plan: plan.id });
  if (plan.price)
    params.set("periodo", billing === "monthly" ? "mensual" : "anual");
  // Plans with a free trial start with self-service signup; the rest still go through the quote form.
  const href = plan.trial
    ? `/registro?periodo=${billing === "monthly" ? "mensual" : "anual"}`
    : `/contacto?${params.toString()}`;
  // While signup is closed the trial button says "Muy pronto" and the line below
  // offers the contact form instead.
  const soon = Boolean(plan.trial) && !SIGNUP_OPEN;

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

      {soon ? (
        <SquareDisabled className="mt-4">Muy pronto</SquareDisabled>
      ) : (
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
      )}
      {/* Misma altura en todas las tarjetas, tenga o no prueba. */}
      <p className="text-ink-soft mt-2 min-h-5 text-center text-xs">
        {soon ? (
          <>
            ¿Quieres empezar ya?{" "}
            <Link
              href={`/contacto?${params.toString()}`}
              className="text-teal-deep font-semibold underline"
            >
              Escríbenos
            </Link>
          </>
        ) : plan.trial ? (
          `Prueba gratis de ${TRIAL_DAYS} días · sin tarjeta`
        ) : (
          ""
        )}
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
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {shown.map((plan) =>
          plan.price === null ? (
            <ManagersCard key={plan.id} plan={plan} />
          ) : (
            <PlanCard key={plan.id} plan={plan} billing={billing} />
          ),
        )}
      </div>
      <p className="border-cream-dark text-teal-deep mx-auto max-w-4xl rounded-xl border bg-white px-5 py-4 text-center text-sm font-medium">
        {TRIAL_GUARANTEE}
      </p>
      <WelcomePieceOffer />
      {SHOW_PRICES && (
        <p className="text-ink-soft mx-auto max-w-4xl pt-2 text-sm">
          {CURRENCY_NOTE}
        </p>
      )}
    </div>
  );
}
