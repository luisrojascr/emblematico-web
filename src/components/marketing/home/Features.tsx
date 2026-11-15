import { FEATURES } from "@/lib/content/hospitality";

import { SectionHeading } from "./SectionHeading";

export function Features() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-12">
        <SectionHeading
          eyebrow="Funciones"
          title="Todo lo que tu guía puede incluir"
          description="Seis módulos que activas según lo que necesite tu propiedad."
        />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <li
              key={f.title}
              className="border-cream-dark space-y-2 rounded-2xl border bg-white p-6"
            >
              <span className="text-sand-dark font-serif text-2xl">
                0{i + 1}
              </span>
              <h3 className="text-xl">{f.title}</h3>
              <p className="text-ink-soft text-sm">{f.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
