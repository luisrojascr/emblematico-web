"use client";

import { useActionState } from "react";

import { PLANS } from "@/lib/plans";
import { ACCOMMODATION_TYPES, CR_AREAS } from "@/lib/quotes/schema";

import { type QuoteFormState, submitQuote } from "./actions";

const initialState: QuoteFormState = { status: "idle" };

const inputClass =
  "w-full rounded-lg border border-cream-dark bg-white px-3 py-2 outline-none focus:border-sand-dark";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-red-700">
      {message}
    </p>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function QuoteForm({
  defaultProductSlug,
  defaultPlan,
  defaultPieces = 0,
}: {
  defaultProductSlug?: string;
  defaultPlan?: string;
  defaultPieces?: number;
}) {
  const [state, action, pending] = useActionState(submitQuote, initialState);

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="border-cream-dark space-y-4 rounded-2xl border bg-white p-6"
      >
        <h2 className="text-2xl">Solicitud enviada</h2>
        <p className="text-ink-soft">{state.message}</p>
        {state.whatsappUrl && (
          <a
            href={state.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-ink text-cream hover:bg-sand-dark inline-flex rounded-full px-6 py-3 text-sm font-medium"
          >
            Continuar por WhatsApp
          </a>
        )}
      </div>
    );
  }

  const v = state.values;
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      {/* Honeypot: hidden from people and assistive tech, bots tend to fill it. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label>
          No llenar este campo
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <input
        type="hidden"
        name="productSlug"
        value={v?.productSlug ?? defaultProductSlug ?? ""}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Nombre" error={errors.name}>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            defaultValue={v?.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={inputClass}
          />
        </Field>
        <Field
          id="accommodation"
          label="Alojamiento"
          error={errors.accommodation}
        >
          <input
            id="accommodation"
            name="accommodation"
            required
            autoComplete="organization"
            defaultValue={v?.accommodation}
            aria-invalid={Boolean(errors.accommodation)}
            aria-describedby={
              errors.accommodation ? "accommodation-error" : undefined
            }
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="area" label="Zona de Costa Rica" error={errors.area}>
          <select
            id="area"
            name="area"
            required
            defaultValue={v?.area ?? ""}
            aria-invalid={Boolean(errors.area)}
            aria-describedby={errors.area ? "area-error" : undefined}
            className={inputClass}
          >
            <option value="">Selecciona una zona</option>
            {CR_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="accommodationType"
          label="Tipo de alojamiento"
          error={errors.accommodationType}
        >
          <select
            id="accommodationType"
            name="accommodationType"
            required
            defaultValue={v?.accommodationType ?? ""}
            aria-invalid={Boolean(errors.accommodationType)}
            aria-describedby={
              errors.accommodationType ? "accommodationType-error" : undefined
            }
            className={inputClass}
          >
            <option value="">Selecciona una opción</option>
            {ACCOMMODATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="size"
          label="Número de propiedades o habitaciones"
          error={errors.size}
        >
          <input
            id="size"
            name="size"
            required
            defaultValue={v?.size}
            placeholder="Ej.: 1 casa, 4 habitaciones"
            aria-invalid={Boolean(errors.size)}
            aria-describedby={errors.size ? "size-error" : undefined}
            className={inputClass}
          />
        </Field>
        <Field id="phone" label="WhatsApp" error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            defaultValue={v?.phone}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="plan" label="Plan de interés" error={errors.plan}>
          <select
            id="plan"
            name="plan"
            defaultValue={v?.plan ?? defaultPlan ?? ""}
            aria-invalid={Boolean(errors.plan)}
            aria-describedby={errors.plan ? "plan-error" : undefined}
            className={inputClass}
          >
            <option value="">Aún no lo sé</option>
            {PLANS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="pieces"
          label="Piezas de bienvenida 3D (cantidad)"
          error={errors.pieces}
        >
          <input
            id="pieces"
            name="pieces"
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            step={1}
            defaultValue={v?.pieces ?? String(defaultPieces)}
            aria-invalid={Boolean(errors.pieces)}
            aria-describedby={errors.pieces ? "pieces-error" : undefined}
            className={inputClass}
          />
        </Field>
      </div>

      <Field id="message" label="Mensaje (opcional)" error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={4}
          defaultValue={v?.message}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={inputClass}
          placeholder="Cuéntanos sobre tu propiedad o qué te gustaría ver en la demo."
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-cream hover:bg-sand-dark rounded-full px-6 py-3 text-sm font-medium transition-colors disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Solicitar demo o propuesta"}
      </button>

      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
