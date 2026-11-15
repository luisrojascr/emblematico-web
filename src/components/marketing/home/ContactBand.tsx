import { SquareExternalLink, SquareLink } from "@/components/ui/SquareButton";
import { whatsappLink } from "@/lib/site";

export function ContactBand() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-12">
        <div className="border-cream-dark bg-cream flex flex-col items-start gap-6 rounded-2xl border p-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-2">
            <h2 className="text-3xl">Hablemos de tu alojamiento</h2>
            <p className="text-ink-soft">
              Pide una demo o una propuesta. Te respondemos por WhatsApp.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <SquareLink href="/contacto">Completar el formulario</SquareLink>
            <SquareExternalLink
              variant="outline"
              href={whatsappLink(
                "Hola, me gustaría una propuesta de emblemático para mi alojamiento.",
              )}
            >
              Escribir por WhatsApp
            </SquareExternalLink>
          </div>
        </div>
      </div>
    </section>
  );
}
