import { FAQ } from "@/lib/content/hospitality";

import { SectionHeading } from "./SectionHeading";

export function FaqAccordion() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-12">
        <SectionHeading
          eyebrow="Preguntas frecuentes"
          title="Lo que suelen preguntarnos"
        />
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group border-cream-dark rounded-xl border bg-white px-5 py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden="true"
                  className="text-sand-dark text-2xl leading-none transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="text-ink-soft mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
