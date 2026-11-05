"use client";

import { useActionState } from "react";

import { BUSINESS_TYPES } from "@/lib/quotes/schema";

import { type QuoteFormState, submitQuote } from "./actions";

type ProductOption = { slug: string; name: string };

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

export function QuoteForm({
  products,
  defaultProductSlug,
}: {
  products: ProductOption[];
  defaultProductSlug?: string;
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

      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre
        </label>
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
        <FieldError id="name-error" message={errors.name} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="phone" className="text-sm font-medium">
            Teléfono / WhatsApp
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={v?.phone}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={inputClass}
          />
          <FieldError id="phone-error" message={errors.phone} />
        </div>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={v?.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={inputClass}
          />
          <FieldError id="email-error" message={errors.email} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="businessType" className="text-sm font-medium">
            Tipo de negocio
          </label>
          <select
            id="businessType"
            name="businessType"
            defaultValue={v?.businessType ?? ""}
            className={inputClass}
          >
            <option value="">Selecciona una opción</option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <FieldError id="businessType-error" message={errors.businessType} />
        </div>
        <div className="space-y-1">
          <label htmlFor="productSlug" className="text-sm font-medium">
            Producto de interés
          </label>
          <select
            id="productSlug"
            name="productSlug"
            defaultValue={v?.productSlug ?? defaultProductSlug ?? ""}
            className={inputClass}
          >
            <option value="">Aún no estoy seguro</option>
            {products.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="message" className="text-sm font-medium">
          Mensaje
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          defaultValue={v?.message}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={inputClass}
          placeholder="Cuéntanos sobre tu negocio y lo que necesitas."
        />
        <FieldError id="message-error" message={errors.message} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-cream hover:bg-sand-dark rounded-full px-6 py-3 text-sm font-medium transition-colors disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar solicitud"}
      </button>

      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
