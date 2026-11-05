import type { Metadata } from "next";
import { Suspense } from "react";

import { ExternalButtonLink } from "@/components/ui/ButtonLink";
import { getProducts } from "@/lib/catalog/data";
import { whatsappLink } from "@/lib/site";

import { QuoteForm } from "./QuoteForm";

export const metadata: Metadata = {
  title: "Contacto y cotización",
  description:
    "Solicita tu cotización de productos impresos en 3D con QR y landing digital. Escríbenos por WhatsApp o envía el formulario.",
  alternates: { canonical: "/contacto" },
};

async function ContactForm({
  searchParams,
}: Pick<PageProps<"/contacto">, "searchParams">) {
  const [products, query] = await Promise.all([getProducts(), searchParams]);
  const requested =
    typeof query.producto === "string" ? query.producto : undefined;
  const options = products.map((p) => ({ slug: p.slug, name: p.name }));
  const defaultProductSlug = options.some((p) => p.slug === requested)
    ? requested
    : undefined;

  return (
    <QuoteForm products={options} defaultProductSlug={defaultProductSlug} />
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
            <h1 className="text-4xl">Solicita tu cotización</h1>
            <p className="text-ink-soft max-w-xl">
              Cuéntanos sobre tu negocio y te respondemos con una propuesta a la
              medida.
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
              "Hola, me gustaría cotizar productos de emblemático.",
            )}
          >
            Cotizar por WhatsApp
          </ExternalButtonLink>
          <p className="text-ink-soft text-sm">+506 8899 7060</p>
        </aside>
      </div>
    </section>
  );
}
