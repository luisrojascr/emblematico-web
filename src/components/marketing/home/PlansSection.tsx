import Link from "next/link";

import { PlanCards } from "@/components/marketing/PlanCards";

import { SectionHeading } from "./SectionHeading";

export function PlansSection() {
  return (
    <section id="planes" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-12">
        <SectionHeading
          eyebrow="Planes"
          title="Planes para cada tamaño de operación"
          description="Desde un alojamiento hasta carteras completas. Agrega piezas de bienvenida 3D a cualquier plan, con precio por cantidad."
        />
        <PlanCards />
        <p className="text-ink-soft mt-6 text-sm">
          También tenemos productos para negocios en general.{" "}
          <Link href="/productos" className="text-sand-dark underline">
            Ver catálogo completo
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
