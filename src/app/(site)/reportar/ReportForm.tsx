"use client";

import { useActionState } from "react";

import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { REPORT_DETAILS_MAX, REPORT_REASONS } from "@/lib/reports/schema";

import { type ReportState, submitReport } from "./actions";

const initialState: ReportState = { status: "idle" };

const inputClass =
  "border-cream-dark w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-teal-deep focus:ring-2 focus:ring-aqua/40";
const primaryClass =
  "bg-sand text-ink hover:bg-sand-hover w-full rounded-full px-4 py-3 font-semibold transition-colors disabled:opacity-60";

export function ReportForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(submitReport, initialState);

  if (state.status === "success") {
    return (
      <p
        role="status"
        className="border-cream-dark rounded-2xl border bg-white p-5"
      >
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">
          ¿Qué problema tiene esta guía?
        </legend>
        {REPORT_REASONS.map((reason) => (
          <label key={reason.id} className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              name="reason"
              value={reason.id}
              required
              className="accent-teal-deep mt-0.5 size-4"
            />
            <span>{reason.label}</span>
          </label>
        ))}
        {state.fieldErrors?.reason ? (
          <p className="text-sm text-red-700">{state.fieldErrors.reason}</p>
        ) : null}
      </fieldset>

      <div className="space-y-1">
        <label htmlFor="details" className="text-sm font-semibold">
          Cuéntanos qué viste (opcional)
        </label>
        <textarea
          id="details"
          name="details"
          rows={4}
          maxLength={REPORT_DETAILS_MAX}
          className={inputClass}
        />
        {state.fieldErrors?.details ? (
          <p className="text-sm text-red-700">{state.fieldErrors.details}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="contactEmail" className="text-sm font-semibold">
          Tu correo (opcional)
        </label>
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          maxLength={200}
          autoComplete="email"
          aria-describedby="contact-hint"
          className={inputClass}
        />
        <p id="contact-hint" className="text-ink-soft text-xs">
          Solo lo usamos si necesitamos más información sobre el reporte.
        </p>
        {state.fieldErrors?.contactEmail ? (
          <p className="text-sm text-red-700">
            {state.fieldErrors.contactEmail}
          </p>
        ) : null}
      </div>

      {/* Honeypot: hidden from people and assistive tech, bots tend to fill it. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="website">Sitio web</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <TurnstileWidget resetOn={state} />

      <button type="submit" disabled={pending} className={primaryClass}>
        {pending ? "Enviando..." : "Enviar reporte"}
      </button>

      {state.status === "error" && state.message ? (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
