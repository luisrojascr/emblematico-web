import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { TRIAL_DAYS } from "@/lib/plans";
import { SIGNUP_OPEN } from "@/lib/site";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false },
};

async function LoginNotice({
  searchParams,
}: {
  searchParams: PageProps<"/ingresar">["searchParams"];
}) {
  const query = await searchParams;
  if (query.error !== "enlace") return null;
  return (
    <p role="alert" className="mb-4 text-sm text-red-700">
      Ese enlace ya no sirve. Pide uno nuevo.
    </p>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/ingresar">) {
  return (
    <section className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <h1 className="mb-2 text-3xl">Ingresar</h1>
      <p className="text-ink-soft mb-8">
        Entra con tu correo y contraseña. Si recibiste una invitación y aún no
        tienes contraseña, usa &ldquo;¿Olvidaste tu contraseña?&rdquo;. ¿Primera
        vez?{" "}
        {SIGNUP_OPEN ? (
          <Link
            href="/registro"
            className="text-teal-deep font-semibold underline"
          >
            Empieza {TRIAL_DAYS} días gratis
          </Link>
        ) : (
          <>
            El registro abre muy pronto. Mientras tanto,{" "}
            <Link
              href="/contacto"
              className="text-teal-deep font-semibold underline"
            >
              escríbenos
            </Link>
          </>
        )}
        .
      </p>
      <Suspense fallback={null}>
        <LoginNotice searchParams={searchParams} />
      </Suspense>
      <LoginForm />
    </section>
  );
}
