import { ButtonLink, ExternalButtonLink } from "@/components/ui/ButtonLink";
import { whatsappLink } from "@/lib/site";

type Props = {
  title?: string;
  description?: string;
  whatsappMessage?: string;
};

export function CtaBanner({
  title = "Hablemos de tu negocio",
  description = "Cuéntanos qué necesitas y te preparamos una cotización a la medida.",
  whatsappMessage = "Hola, me gustaría cotizar productos de emblemático para mi negocio.",
}: Props) {
  return (
    <section className="bg-ink text-cream">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl space-y-2">
          <h2 className="text-3xl">{title}</h2>
          <p className="text-cream/75">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ExternalButtonLink
            variant="light"
            href={whatsappLink(whatsappMessage)}
          >
            Cotizar por WhatsApp
          </ExternalButtonLink>
          <ButtonLink
            href="/contacto"
            variant="secondary"
            className="border-cream/40 text-cream hover:border-cream hover:bg-cream/10"
          >
            Escribir un mensaje
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
