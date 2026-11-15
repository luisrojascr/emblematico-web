import { SquareLink } from "@/components/ui/SquareButton";
import { STEPS } from "@/lib/content/hospitality";

import { SectionHeading } from "./SectionHeading";

export function ProcessSteps() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-12">
        <SectionHeading
          eyebrow="Implementación"
          title="Tres pasos, sin complicaciones"
        />
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="border-cream-dark space-y-3 rounded-2xl border bg-white p-6"
            >
              <span className="text-sand-dark font-serif text-4xl">
                0{i + 1}
              </span>
              <h3 className="text-xl">{step.title}</h3>
              <p className="text-ink-soft text-sm">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <SquareLink href="/como-funciona" variant="outline">
            Ver las funciones
          </SquareLink>
        </div>
      </div>
    </section>
  );
}
