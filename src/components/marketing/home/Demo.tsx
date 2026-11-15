import { GuidePreview } from "@/components/marketing/GuidePreview";
import { SquareLink } from "@/components/ui/SquareButton";
import { SITE } from "@/lib/site";

import { ArrowIcon } from "./icons";

export function Demo() {
  return (
    <section id="demo" className="bg-ink text-cream">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-12">
        <div className="space-y-5">
          <p className="text-sand text-[11px] font-semibold tracking-[0.18em] uppercase">
            Demo
          </p>
          <h2 className="text-3xl sm:text-4xl">Conoce Casa Nébora</h2>
          <p className="text-cream/75 max-w-lg">
            Casa Nébora es una propiedad ficticia creada solo para demostrar
            cómo se ve y se usa la guía. No es un cliente real.
          </p>
          <SquareLink href={SITE.demoPath} variant="bronze">
            Ver demo <ArrowIcon />
          </SquareLink>
        </div>
        <div className="flex justify-center">
          <GuidePreview />
        </div>
      </div>
    </section>
  );
}
