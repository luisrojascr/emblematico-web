import { SquareLink } from "@/components/ui/SquareButton";

import { CubeIcon, PhoneIcon, ShieldIcon } from "./icons";
import { SectionHeading } from "./SectionHeading";

export function Solution() {
  return (
    <section id="solucion" className="bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-12">
        <SectionHeading
          eyebrow="La solución"
          title="Pieza 3D + guía digital"
          description="Una pieza de bienvenida personalizada, impresa en 3D, con un código QR que abre la guía digital de tu propiedad. Facilita el acceso a la información, reduce las preguntas repetidas y te permite presentar tus servicios y recomendaciones."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border-cream-dark space-y-3 rounded-2xl border bg-white p-6 sm:p-8">
            <span className="text-sand-dark">
              <CubeIcon />
            </span>
            <h3 className="text-2xl">La pieza física</h3>
            <p className="text-ink-soft">
              Pieza de bienvenida personalizada, impresa en 3D, con un código
              QR.
            </p>
          </div>
          <div className="border-cream-dark space-y-3 rounded-2xl border bg-white p-6 sm:p-8">
            <span className="text-sand-dark">
              <PhoneIcon />
            </span>
            <h3 className="text-2xl">La guía digital</h3>
            <p className="text-ink-soft">
              Guía en español, inglés y francés. Se abre con la cámara, sin
              instalar una app.
            </p>
          </div>
        </div>
        <p className="text-ink-soft mt-6 flex items-start gap-3 text-sm">
          <span className="text-sand-dark shrink-0">
            <ShieldIcon />
          </span>
          No publiques códigos de acceso ni datos sensibles en una página
          abierta a quien tenga el QR.
        </p>
        <div className="mt-8">
          <SquareLink href="/landing-digital" variant="outline">
            Conocer la solución
          </SquareLink>
        </div>
      </div>
    </section>
  );
}
