import type { Metadata } from "next";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <h1 className="mb-2 text-3xl">Ingresar</h1>
      <p className="text-ink-soft mb-8">
        Te enviaremos un enlace seguro a tu correo. Solo cuentas creadas por
        emblemático.
      </p>
      <LoginForm />
    </section>
  );
}
