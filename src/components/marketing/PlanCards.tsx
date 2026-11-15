"use client";

import Image from "next/image";
import { useState } from "react";

import { SquareLink } from "@/components/ui/SquareButton";
import {
  CURRENCY_NOTE,
  MAX_PIECES_ONLINE,
  MAX_SELF_SERVE_PROPERTIES,
  PIECE_TIERS,
  PLANS,
  SHOW_PRICES,
  WELCOME_PIECE,
  type Plan,
  firstYearTotal,
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

function PlanPrice({ plan }: { plan: Plan }) {
  if (plan.price === 0)
    return (
      <>
        {formatUsd(0)}
        <span className="text-ink-soft ml-2 font-sans text-sm">Sin costo</span>
      </>
    );
  if (!SHOW_PRICES || plan.price === null) return <>Cotiza</>;
  return (
    <>
      {formatUsd(plan.price)}
      <span className="text-ink-soft ml-1 font-sans text-sm">/año</span>
    </>
  );
}

function totalText(plan: Plan, pieces: number): string {
  if (pieces === 0 || !SHOW_PRICES) return "";
  const total = firstYearTotal(plan, pieces);
  if (total === null) return "Te enviamos una cotización por las piezas.";
  return plan.price === 0
    ? `Total: ${formatUsd(total)}, pago único`
    : `Total el primer año: ${formatUsd(total)}`;
}

function PlanCard({ plan }: { plan: Plan }) {
  const [pieces, setPieces] = useState(0);
  const isFree = plan.id === "free";
  const href = `/contacto?plan=${plan.id}${pieces > 0 ? `&piezas=${pieces}` : ""}`;

  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-white p-6 sm:p-8 ${
        plan.highlighted
          ? "border-sand border-2 shadow-lg"
          : "border-cream-dark"
      }`}
    >
      {plan.highlighted && (
        <span className="bg-sand text-ink absolute -top-3 left-6 rounded-[4px] px-3 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase sm:left-8">
          Más recomendado
        </span>
      )}
      <h3 className="text-2xl">{plan.name}</h3>
      <p className="text-ink-soft mt-2 text-sm lg:min-h-10">{plan.summary}</p>
      <p className="mt-6 font-serif text-4xl">
        <PlanPrice plan={plan} />
      </p>
      {/* Misma altura en todas las tarjetas, haya o no alojamiento adicional. */}
      <p className="text-ink-soft mt-1 min-h-4 text-xs">
        {SHOW_PRICES && plan.extraProperty
          ? `Alojamiento adicional: +${formatUsd(plan.extraProperty)}/año (hasta ${MAX_SELF_SERVE_PROPERTIES})`
          : ""}
      </p>
      <ul className="text-ink-soft mt-6 mb-6 flex-1 space-y-2 text-sm">
        {plan.includes.map((item) => (
          <li key={item}>✓ {item}</li>
        ))}
      </ul>

      <PieceSelector planId={plan.id} quantity={pieces} onChange={setPieces} />
      <p
        className="text-ink-soft mt-3 min-h-5 text-sm font-medium"
        aria-live="polite"
      >
        {totalText(plan, pieces)}
      </p>

      <SquareLink
        href={href}
        variant={plan.highlighted ? "primary" : "outline"}
        className="mt-4"
      >
        {isFree ? "Comenzar gratis" : "Solicitar propuesta"}
      </SquareLink>
    </article>
  );
}

function ManagersCard({ plan }: { plan: Plan }) {
  return (
    <article className="bg-ink text-cream grid gap-8 rounded-2xl p-6 sm:p-8 lg:grid-cols-[1.1fr_1.4fr_auto] lg:items-center lg:gap-12">
      <div className="space-y-2">
        <p className="text-sand text-[11px] font-semibold tracking-[0.18em] uppercase">
          Cotización a la medida
        </p>
        <h3 className="text-3xl">{plan.name}</h3>
        <p className="text-cream/75 text-sm">{plan.summary}</p>
      </div>
      <ul className="text-cream/85 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        {plan.includes.map((item) => (
          <li key={item}>✓ {item}</li>
        ))}
      </ul>
      <SquareLink href={`/contacto?plan=${plan.id}`} variant="bronze">
        Solicitar cotización
      </SquareLink>
    </article>
  );
}

export function PlanCards() {
  const selfServe = PLANS.filter((p) => p.price !== null);
  const custom = PLANS.filter((p) => p.price === null);
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {selfServe.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
      {custom.map((plan) => (
        <ManagersCard key={plan.id} plan={plan} />
      ))}
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
