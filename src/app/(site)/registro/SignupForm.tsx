"use client";

import Link from "next/link";
import { useActionState } from "react";

import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { DEFAULT_COUNTRY, type CountryOption } from "@/lib/auth/countries";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/signup";

import { type SignupState, signUp } from "./actions";

const initialState: SignupState = { status: "idle" };

const inputClass =
  "border-cream-dark w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-teal-deep focus:ring-2 focus:ring-aqua/40";
const primaryClass =
  "bg-sand text-ink hover:bg-sand-hover w-full rounded-full px-4 py-3 font-semibold transition-colors disabled:opacity-60";
const linkClass = "text-teal-deep font-semibold underline";

export function SignupForm({ countries }: { countries: CountryOption[] }) {
  const [state, action, pending] = useActionState(signUp, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="fullName" className="text-sm font-semibold">
          Nombre
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-semibold">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-semibold">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          autoComplete="new-password"
          aria-describedby="password-hint"
          className={inputClass}
        />
        <p id="password-hint" className="text-ink-soft text-xs">
          Mínimo {PASSWORD_MIN_LENGTH} caracteres, con letras y números.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="country" className="text-sm font-semibold">
          País
        </label>
        <select
          id="country"
          name="country"
          required
          defaultValue={DEFAULT_COUNTRY}
          className={inputClass}
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
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

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="terms"
          required
          className="accent-teal-deep mt-1 size-4"
        />
        <span>
          Acepto los{" "}
          <Link href="/terminos" target="_blank" className={linkClass}>
            términos de uso
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" target="_blank" className={linkClass}>
            política de privacidad
          </Link>
          .
        </span>
      </label>

      <TurnstileWidget resetOn={state} />

      <button type="submit" disabled={pending} className={primaryClass}>
        {pending ? "Creando tu cuenta..." : "Crear cuenta"}
      </button>

      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-sm text-red-700"
              : "text-ink-soft text-sm"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
