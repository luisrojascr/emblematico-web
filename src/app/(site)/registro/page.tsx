import type { Metadata } from "next";
import Link from "next/link";

import { countryOptions } from "@/lib/auth/countries";
import { TRIAL_DAYS, TRIAL_GUARANTEE } from "@/lib/plans";

import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false },
};

export default function SignupPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <h1 className="mb-2 text-3xl">Empieza {TRIAL_DAYS} días gratis</h1>
      <p className="text-ink-soft mb-2">
        Crea tu cuenta y prueba Hospitality Essential sin tarjeta.
      </p>
      <p className="text-ink-soft mb-8 text-sm">{TRIAL_GUARANTEE}</p>
      <SignupForm countries={countryOptions("es")} />
      <p className="text-ink-soft mt-6 text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/ingresar"
          className="text-teal-deep font-semibold underline"
        >
          Ingresar
        </Link>
      </p>
    </section>
  );
}
