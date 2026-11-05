import Image from "next/image";

import { CategoryCard } from "@/components/marketing/CategoryCard";
import { CtaBanner } from "@/components/marketing/CtaBanner";
import { Section } from "@/components/marketing/Section";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/ButtonLink";
import { getCategories } from "@/lib/catalog/data";
import { SITE, whatsappLink } from "@/lib/site";

const STEPS = [
  {
    title: "Cuéntanos tu negocio",
    text: "Nos escribes por WhatsApp con el tipo de negocio y lo que necesitas identificar.",
  },
  {
    title: "Diseñamos tu marca en 3D",
    text: "Personalizamos productos con tu nombre, logo y colores, y preparamos tu página digital.",
  },
  {
    title: "Instalas y actualizas",
    text: "Recibes tus productos con QR. Cambias la información cuando quieras, sin reimprimir.",
  },
] as const;

async function Categories() {
  const categories = await getCategories();
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="text-sand-dark text-xs font-medium tracking-[0.2em] uppercase">
              Impresión 3D · Costa Rica
            </p>
            <h1 className="text-4xl leading-tight sm:text-5xl lg:text-6xl">
              {SITE.tagline}
            </h1>
            <p className="text-ink-soft max-w-lg text-lg">
              Productos personalizados impresos en 3D con código QR, conectados
              a una página digital que tú mismo puedes actualizar. Para hoteles,
              restaurantes y negocios.
            </p>
            <div className="flex flex-wrap gap-3">
              <ExternalButtonLink
                href={whatsappLink(
                  "Hola, me gustaría cotizar productos de emblemático.",
                )}
              >
                Cotizar por WhatsApp
              </ExternalButtonLink>
              <ButtonLink href="/productos" variant="secondary">
                Ver productos
              </ButtonLink>
            </div>
          </div>
          <div className="bg-cream-dark relative aspect-[3/2] overflow-hidden rounded-3xl shadow-xl">
            <Image
              src="/images/overview.webp"
              alt="Welcome Station, placas de servicios y kit de hospedaje personalizados con código QR"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <Section
        eyebrow="Productos"
        title="Soluciones para tu espacio"
        description="Cuatro líneas pensadas para que tus huéspedes y clientes encuentren la información justa, con tu identidad."
        tone="white"
      >
        <Categories />
        <div className="mt-10">
          <ButtonLink href="/productos" variant="secondary">
            Ver todo el catálogo
          </ButtonLink>
        </div>
      </Section>

      <Section
        eyebrow="Cómo funciona"
        title="De la idea a tu mostrador en tres pasos"
      >
        <ol className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="space-y-3">
              <span className="text-sand-dark font-serif text-4xl">
                0{index + 1}
              </span>
              <h3 className="text-xl">{step.title}</h3>
              <p className="text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <ButtonLink href="/como-funciona" variant="secondary">
            Conocer el proceso
          </ButtonLink>
        </div>
      </Section>

      <Section
        eyebrow="Landing digital"
        title="Tu QR siempre lleva a información al día"
        description="Cada producto con QR apunta a una página móvil con tu logo, tus colores y tu información. Cambias horarios, Wi-Fi, reglas o enlaces desde un panel simple. El QR nunca cambia."
        tone="ink"
      >
        <ButtonLink href="/landing-digital" variant="light">
          Ver cómo funciona la landing
        </ButtonLink>
      </Section>

      <CtaBanner />
    </>
  );
}
