import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SiteShell } from "@/components/site/SiteShell";

import { ConfirmForm } from "./ConfirmForm";

export const metadata: Metadata = {
  title: "Confirmar correo",
  robots: { index: false },
};

async function ConfirmBody({
  searchParams,
}: {
  searchParams: PageProps<"/auth/confirm">["searchParams"];
}) {
  const query = await searchParams;
  const tokenHash =
    typeof query.token_hash === "string" ? query.token_hash : "";
  const type = typeof query.type === "string" ? query.type : "email";

  if (!tokenHash) {
    return (
      <p className="text-ink-soft">
        Este enlace no es válido. Abre el enlace del correo que te enviamos o{" "}
        <Link
          href="/registro"
          className="text-teal-deep font-semibold underline"
        >
          crea tu cuenta
        </Link>
        .
      </p>
    );
  }

  return (
    <>
      <p className="text-ink-soft mb-6">
        Un último paso: confirma tu correo para activar tu cuenta.
      </p>
      <ConfirmForm tokenHash={tokenHash} type={type} />
    </>
  );
}

export default function ConfirmPage({
  searchParams,
}: PageProps<"/auth/confirm">) {
  // Lives outside the (site) group next to the other /auth routes, so it adds the
  // site chrome itself.
  return (
    <SiteShell>
      <section className="mx-auto max-w-md px-4 py-20">
        <h1 className="mb-4 text-3xl">Confirmar correo</h1>
        <Suspense fallback={null}>
          <ConfirmBody searchParams={searchParams} />
        </Suspense>
      </section>
    </SiteShell>
  );
}
