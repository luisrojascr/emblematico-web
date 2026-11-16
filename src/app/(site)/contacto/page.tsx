import type { Metadata } from "next";
import { Suspense } from "react";

import { ExternalButtonLink } from "@/components/ui/ButtonLink";
import { getProducts } from "@/lib/catalog/data";
import { DEFAULT_BILLING, getPlan, parseBilling } from "@/lib/plans";
import { whatsappLink } from "@/lib/site";

import { QuoteForm } from "./QuoteForm";

export const metadata: Metadata = {
  title: "Solicita una demo o propuesta para tu alojamiento",
  description:
    "Pide una demo o una propuesta de guía digital y pieza de bienvenida para tu casa vacacional, Airbnb, cabinas u hotel boutique en Costa Rica.",
  alternates: { canonical: "/contacto" },
};

async function ContactForm({
  searchParams,
}: Pick<PageProps<"/contacto">, "searchParams">) {
  const [products, query] = await Promise.all([getProducts(), searchParams]);
  const requested =
    typeof query.producto === "string" ? query.producto : undefined;
  const defaultProductSlug = products.some((p) => p.slug === requested)
    ? requested
    : undefined;

  const defaultPlan = getPlan(
    typeof query.plan === "string" ? query.plan : undefined,
  )?.id;
  const defaultBilling =
    parseBilling(
      typeof query.periodo === "string" ? query.periodo : undefined,
    ) ?? DEFAULT_BILLING;
  const requestedPieces =
    typeof query.piezas === "string" ? Number(query.piezas) : 0;
  const defaultPieces =
    Number.isInteger(requestedPieces) &&
    requestedPieces >= 0 &&
    requestedPieces <= 999
      ? requestedPieces
      : 0;

  return (
    <QuoteForm
      defaultProductSlug={defaultProductSlug}
      defaultPlan={defaultPlan}
      defaultBilling={defaultBilling}
      defaultPieces={defaultPieces}
    />
  );
}

export default function ContactPage(props: PageProps<"/contacto">) {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          <header className="space-y-3">
            <p className="text-sand-dark text-xs font-medium tracking-[0.2em] uppercase">
              Contacto
            </p>
            <h1 className="text-4xl">Solicita una demo o propuesta</h1>
            <p className="text-ink-soft max-w-xl">
              Cuéntanos sobre tu alojamiento y te respondemos con una propuesta
              a la medida.
            </p>
          </header>
          <Suspense
            fallback={<p className="text-ink-soft">Cargando formulario...</p>}
          >
            <ContactForm searchParams={props.searchParams} />
          </Suspense>
        </div>

        <aside className="bg-cream space-y-4 self-start rounded-2xl p-6">
          <h2 className="text-2xl">¿Prefieres WhatsApp?</h2>
          <p className="text-ink-soft">
            Es la forma más rápida de hablar con nosotros. Escríbenos y te
            respondemos.
          </p>
          <ExternalButtonLink
            href={whatsappLink(
              "Hola, me gustaría una propuesta de emblemático para mi alojamiento.",
            )}
          >
            Escribir por WhatsApp
          </ExternalButtonLink>
          <p className="text-ink-soft text-sm">+506 8899 7060</p>
        </aside>
      </div>
    </section>
  );
}
