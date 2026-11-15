import Image from "next/image";

import { SquareLink } from "@/components/ui/SquareButton";
import { SITE } from "@/lib/site";

import { ArrowIcon, EditIcon, GlobeIcon, QrIcon } from "./icons";

const BENEFITS = [
  { label: "Español, inglés y francés", icon: <GlobeIcon /> },
  { label: "Sin app que instalar", icon: <QrIcon /> },
  { label: "Contenido editable", icon: <EditIcon /> },
] as const;

export function Hero() {
  return (
    <section className="bg-cream border-cream-dark border-b">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-12 lg:py-24">
        <div className="space-y-6 lg:col-span-7">
          <p className="text-sand-dark border-sand/60 inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase">
            <span
              aria-hidden="true"
              className="bg-sand-dark h-2 w-2 rounded-full"
            />
            Hospitality · Costa Rica
          </p>
          <h1 className="text-4xl leading-tight font-semibold sm:text-5xl lg:text-[3.4rem] lg:leading-[1.15]">
            Una mejor bienvenida. <span className="text-sand-dark">Menos trabajo</span>{" "}
            para tu propiedad.
          </h1>
          <p className="text-ink-soft max-w-xl text-lg leading-relaxed">
            Reúne las instrucciones, el Wi-Fi, las recomendaciones y los
            servicios de tu propiedad en una guía digital multilingüe, conectada
            a una pieza de bienvenida personalizada.
          </p>
          <div className="flex flex-wrap gap-4">
            <SquareLink href={SITE.demoPath}>
              Ver demo <ArrowIcon />
            </SquareLink>
            <SquareLink href="/contacto" variant="outline">
              Solicitar propuesta
            </SquareLink>
          </div>
          <ul className="border-cream-dark grid gap-5 border-t pt-8 sm:grid-cols-3">
            {BENEFITS.map((b) => (
              <li key={b.label} className="flex items-start gap-3">
                <span className="text-sand-dark shrink-0">{b.icon}</span>
                <span className="text-sm font-semibold">{b.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-5">
          <div className="border-cream-dark bg-cream-dark rounded-2xl border p-4 shadow-xl sm:p-5">
            <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-white">
              <Image
                src="/images/overview.webp"
                alt="Welcome Station, placas de servicios y kit de hospedaje personalizados con código QR"
                fill
                fetchPriority="high"
                loading="eager"
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
