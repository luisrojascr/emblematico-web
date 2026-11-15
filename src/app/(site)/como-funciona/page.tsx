import type { Metadata } from "next";

import { CtaBanner } from "@/components/marketing/CtaBanner";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { Section } from "@/components/marketing/Section";
import { Steps } from "@/components/marketing/Steps";

export const metadata: Metadata = {
  title: "Funciones y proceso de implementación",
  description:
    "Cómo implementamos tu guía digital para huéspedes en tres pasos: personalizamos, entregamos y tú actualizas desde tu panel.",
  alternates: { canonical: "/como-funciona" },
};

export default function HowItWorksPage() {
  return (
    <>
      <Section
        eyebrow="Implementación"
        title="Simple para ti, de principio a fin"
        description="Nos encargamos del diseño, la impresión y la configuración. Tú te enfocas en recibir bien a tus huéspedes."
        tone="white"
      >
        <Steps />
      </Section>
      <Section eyebrow="Funciones" title="Qué puede incluir tu guía">
        <FeatureGrid />
      </Section>
      <CtaBanner title="Empecemos con tu propiedad" />
    </>
  );
}
