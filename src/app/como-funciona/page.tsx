import type { Metadata } from "next";

import { CtaBanner } from "@/components/marketing/CtaBanner";
import { Section } from "@/components/marketing/Section";

export const metadata: Metadata = {
  title: "Cómo funciona",
  description:
    "Del primer mensaje a tu mostrador: así trabajamos para crear tus productos impresos en 3D y tu página digital con QR.",
  alternates: { canonical: "/como-funciona" },
};

const STEPS = [
  {
    title: "Cuéntanos qué necesitas",
    text: "Escríbenos por WhatsApp o desde el formulario con el tipo de negocio, los espacios que quieres identificar y tu marca.",
  },
  {
    title: "Recibes una propuesta",
    text: "Te recomendamos los productos que mejor encajan y te enviamos una cotización a la medida.",
  },
  {
    title: "Diseñamos y producimos",
    text: "Personalizamos cada pieza con tu nombre, logo y colores, la imprimimos en 3D y preparamos tu página digital con tu información.",
  },
  {
    title: "Instalas tus productos",
    text: "Recibes tus piezas con el QR ya conectado a tu página. Solo las colocas en tu espacio.",
  },
  {
    title: "Actualizas cuando quieras",
    text: "Entras a tu panel, editas textos, fotos y enlaces, revisas la vista previa y publicas. Sin reimprimir y sin cambiar el QR.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <Section
        eyebrow="Cómo funciona"
        title="Simple para ti, de principio a fin"
        description="Nos encargamos del diseño, la impresión y la configuración. Tú te enfocas en tu negocio."
        tone="white"
      >
        <ol className="grid gap-x-10 gap-y-10 md:grid-cols-2">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-5">
              <span className="text-sand-dark font-serif text-5xl leading-none">
                {index + 1}
              </span>
              <div className="space-y-2">
                <h3 className="text-xl">{step.title}</h3>
                <p className="text-ink-soft">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
      <CtaBanner title="Empecemos con tu proyecto" />
    </>
  );
}
