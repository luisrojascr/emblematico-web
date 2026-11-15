import { PROBLEMS } from "@/lib/content/hospitality";

import { ChatIcon, ClockIcon, GlobeIcon, PinIcon } from "./icons";
import { SectionHeading } from "./SectionHeading";

const ICONS = [
  <ClockIcon key="c" />,
  <ChatIcon key="m" />,
  <GlobeIcon key="g" />,
  <PinIcon key="p" />,
];

export function Problems() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-12">
        <SectionHeading
          eyebrow="El reto"
          title="Situaciones comunes en los alojamientos"
          description="Si te suena familiar, una buena bienvenida puede ahorrarte mensajes y malentendidos."
        />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((p, i) => (
            <li
              key={p.title}
              className="border-cream-dark bg-cream/40 space-y-3 rounded-2xl border p-6"
            >
              <span className="text-sand-dark">{ICONS[i]}</span>
              <h3 className="text-xl">{p.title}</h3>
              <p className="text-ink-soft text-sm">{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
