import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";

import { PENDING_EMAIL_COOKIE } from "@/lib/auth/signup";

import { ResendForm } from "./ResendForm";

export const metadata: Metadata = {
  title: "Revisa tu correo",
  robots: { index: false },
};

async function PendingEmail() {
  const email = (await cookies()).get(PENDING_EMAIL_COOKIE)?.value;

  if (!email) {
    return (
      <p className="text-ink-soft">
        Si ya creaste tu cuenta, abre el enlace que te enviamos por correo. Si
        no, puedes{" "}
        <Link
          href="/registro"
          className="text-teal-deep font-semibold underline"
        >
          registrarte aquí
        </Link>
        .
      </p>
    );
  }

  return (
    <>
      <p className="text-ink-soft mb-2">
        Te enviamos un enlace de confirmación a{" "}
        <strong className="text-ink">{email}</strong>. Ábrelo para activar tu
        cuenta y empezar tu prueba.
      </p>
      <p className="text-ink-soft mb-8 text-sm">
        Si no lo ves en unos minutos, revisa la carpeta de spam.
      </p>
      <ResendForm />
    </>
  );
}

export default function VerifyPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <h1 className="mb-4 text-3xl">Revisa tu correo</h1>
      <Suspense fallback={null}>
        <PendingEmail />
      </Suspense>
    </section>
  );
}
