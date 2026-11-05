import type { Metadata } from "next";
import Image from "next/image";

import { CtaBanner } from "@/components/marketing/CtaBanner";
import { Section } from "@/components/marketing/Section";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "emblemático combina productos personalizados impresos en 3D con experiencias digitales simples para negocios en Costa Rica.",
  alternates: { canonical: "/nosotros" },
};

const VALUES = [
  {
    title: "Premium",
    text: "Piezas con acabado cuidado y diseño limpio que elevan la imagen de tu espacio.",
  },
  {
    title: "Personalizable",
    text: "Cada producto lleva tu nombre, tu logo y tus colores. Nada genérico.",
  },
  {
    title: "Versátil",
    text: "Funciona para hospedaje, restaurantes, comercios y negocios de servicios.",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <Section
        eyebrow="Nosotros"
        title="Diseño y soluciones que distinguen tu negocio"
        description="emblemático nace para que los negocios en Costa Rica comuniquen mejor su identidad. Combinamos productos personalizados impresos en 3D con experiencias digitales simples, conectadas por un código QR."
        tone="white"
      >
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="text-ink-soft space-y-4">
            <p>
              Un emblema moderno y minimalista que representa distinción,
              identidad y conexión entre tu marca, tus espacios y tus clientes.
              Esa es la idea detrás de todo lo que hacemos.
            </p>
            <p>
              Trabajamos con hoteles, alojamientos vacacionales, restaurantes,
              cafés, comercios y negocios de servicios que quieren verse bien y
              facilitarle la vida a quienes los visitan.
            </p>
          </div>
          <div className="bg-cream-dark relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lg">
            <Image
              src="/images/brand-board.webp"
              alt="Identidad de emblemático: logo, paleta de colores y aplicaciones en señalética 3D"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Section>

      <Section eyebrow="Atributos" title="Lo que nos define">
        <div className="grid gap-8 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="space-y-2">
              <h3 className="text-2xl">{v.title}</h3>
              <p className="text-ink-soft">{v.text}</p>
            </div>
          ))}
        </div>
      </Section>
      <CtaBanner />
    </>
  );
}
