import type { Metadata } from "next";
import { Suspense } from "react";

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
        Te enviaremos un enlace seguro a tu correo. Solo cuentas creadas por
        emblemático.
      </p>
      <Suspense fallback={null}>
        <LoginNotice searchParams={searchParams} />
      </Suspense>
      <LoginForm />
    </section>
  );
}
