import type { Metadata } from "next";
import { Suspense } from "react";

import { Catalog } from "@/components/marketing/home/Catalog";
import { ContactBand } from "@/components/marketing/home/ContactBand";
import { Demo } from "@/components/marketing/home/Demo";
import { FaqAccordion } from "@/components/marketing/home/FaqAccordion";
import { Features } from "@/components/marketing/home/Features";
import { Hero } from "@/components/marketing/home/Hero";
import { PlansSection } from "@/components/marketing/home/PlansSection";
import { ProcessSteps } from "@/components/marketing/home/ProcessSteps";
import { Problems } from "@/components/marketing/home/Problems";
import { Solution } from "@/components/marketing/home/Solution";

export const metadata: Metadata = {
  title:
    "Guía digital para huéspedes y soluciones para alojamientos en Costa Rica",
  description:
    "Guía digital bilingüe para Airbnb, villas, cabinas y hoteles boutique en Costa Rica, conectada a una pieza de bienvenida impresa en 3D. Solicita una demo o propuesta.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Problems />
      <Solution />
      <Demo />
      <Features />
      <PlansSection />
      <ProcessSteps />
      <Suspense fallback={null}>
        <Catalog />
      </Suspense>
      <FaqAccordion />
      <ContactBand />
    </>
  );
}
