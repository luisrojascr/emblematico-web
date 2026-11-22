import type { Metadata } from "next";
import { cacheLife } from "next/cache";

import { GuidePreview } from "@/components/marketing/GuidePreview";
import { LiveGuidePhone } from "@/components/marketing/LiveGuidePhone";
import { ContactBand } from "@/components/marketing/home/ContactBand";
import { ArrowIcon } from "@/components/marketing/home/icons";
import { SquareExternalLink, SquareLink } from "@/components/ui/SquareButton";
import { renderQrSvg } from "@/lib/qr/render";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Demo en vivo: Casa Nébora",
  description:
    "Recorre una guía digital para huéspedes real, tal como la ve un viajero en su teléfono. Casa Nébora es una propiedad de muestra en Costa Rica.",
  alternates: { canonical: SITE.demoPath },
};

const HIGHLIGHTS = [
  "Wi-Fi, check-in y check-out siempre a mano",
  "Reglas de la casa claras desde el primer día",
  "Recomendaciones de la zona elegidas por ti",
  "Contacto directo por WhatsApp",
  "Sin descargar ninguna aplicación",
] as const;

/** QR hacia la guía demo, para abrirla en el celular desde el escritorio. */
async function demoQrDataUri(): Promise<string> {
  "use cache";
  cacheLife("max");
  const svg = await renderQrSvg(SITE.demoGuideUrl);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export default async function DemoPage() {
  const qr = await demoQrDataUri();

  return (
    <>
      <section className="bg-ink text-cream">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-12 lg:py-14">
          <header className="mx-auto max-w-5xl space-y-4 text-center">
            <p className="text-sand text-[11px] font-semibold tracking-[0.18em] uppercase">
              Experiencia en vivo
            </p>
            <h1 className="text-4xl sm:text-5xl">
              Explora una experiencia real: Casa Nébora
            </h1>
            <p className="text-cream/70 text-sm sm:text-base">
              Demostración interactiva con fines ilustrativos · Propiedad de
              muestra en Costa Rica
            </p>
          </header>

          <div className="mt-12 grid items-center justify-center gap-12 lg:mt-12 lg:grid-cols-[auto_minmax(0,32rem)] lg:gap-16">
            <div className="hidden justify-center lg:flex">
              <LiveGuidePhone
                src={SITE.demoGuideUrl}
                title="Guía de ejemplo de Casa Nébora"
              />
            </div>
            <div className="flex flex-col items-center gap-6 lg:hidden">
              <GuidePreview />
              <SquareLink
                href={SITE.demoGuideUrl}
                variant="bronze"
                className="w-full max-w-72"
              >
                Abrir la guía de ejemplo <ArrowIcon />
              </SquareLink>
            </div>

            <div className="space-y-6">
              <p className="border-sand/40 text-sand inline-block rounded-full border px-4 py-1.5 text-xs font-medium">
                Así la ven tus huéspedes
              </p>
              <h2 className="text-3xl sm:text-4xl">
                La información de la casa, a un toque del huésped
              </h2>
              <p className="text-cream/75">
                Es la misma guía que abre un huésped al escanear el código QR de
                su pieza de bienvenida. Recórrela, toca cada sección y mira cómo
                se ve en un teléfono.
              </p>
              <ul className="text-cream/85 space-y-2 text-sm">
                {HIGHLIGHTS.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden="true" className="text-sand">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <SquareLink href="/contacto" variant="bronze">
                  Pedir demo para mi propiedad
                </SquareLink>
                {/* Solo en escritorio: en el celular ya está el botón de arriba. */}
                <span className="hidden lg:block">
                  <SquareExternalLink
                    href={SITE.demoGuideUrl}
                    variant="outline"
                  >
                    Abrir en otra pestaña
                  </SquareExternalLink>
                </span>
              </div>
              <div className="hidden items-center gap-4 rounded-xl border border-white/15 p-4 lg:flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr}
                  alt="Código QR hacia la guía de Casa Nébora"
                  width={96}
                  height={96}
                  className="h-24 w-24 shrink-0 rounded-md bg-white"
                />
                <p className="text-cream/75 text-sm">
                  ¿Prefieres verla en tu celular? Escanea el código con la
                  cámara, como lo haría un huésped.
                </p>
              </div>
              <p className="text-cream/60 text-xs">
                Casa Nébora es una propiedad ficticia creada solo para esta
                demostración. El Wi-Fi y los contactos son de ejemplo.
              </p>
            </div>
          </div>
        </div>
      </section>
      <ContactBand />
    </>
  );
}
