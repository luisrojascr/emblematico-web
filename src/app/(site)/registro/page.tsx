import type { Metadata } from "next";
import Link from "next/link";

import { SquareLink } from "@/components/ui/SquareButton";
import { countryOptions } from "@/lib/auth/countries";
import { TRIAL_DAYS, TRIAL_GUARANTEE } from "@/lib/plans";
import { SIGNUP_OPEN } from "@/lib/site";

import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false },
};

function LoginLine() {
  return (
    <p className="text-ink-soft mt-6 text-center text-sm">
      ¿Ya tienes cuenta?{" "}
      <Link href="/ingresar" className="text-teal-deep font-semibold underline">
        Ingresar
      </Link>
    </p>
  );
}

/** Shown instead of the form while NEXT_PUBLIC_SIGNUP_ENABLED is off. */
function SignupSoon() {
  return (
    <section className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <h1 className="mb-2 text-3xl">Muy pronto</h1>
      <p className="text-ink-soft mb-8">
        Estamos dando los últimos toques al registro en línea. Mientras tanto,
        escríbenos y te ayudamos a crear la guía de tu alojamiento.
      </p>
      <SquareLink href="/contacto?plan=essential" className="w-full">
        Escríbenos
      </SquareLink>
      <LoginLine />
    </section>
  );
}

export default function SignupPage() {
  if (!SIGNUP_OPEN) return <SignupSoon />;
  return (
    <section className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <h1 className="mb-2 text-3xl">Empieza {TRIAL_DAYS} días gratis</h1>
      <p className="text-ink-soft mb-2">
        Crea tu cuenta y prueba Hospitality Essential sin tarjeta.
      </p>
      <p className="text-ink-soft mb-8 text-sm">{TRIAL_GUARANTEE}</p>
      <SignupForm countries={countryOptions("es")} />
      <LoginLine />
    </section>
  );
}
