import type { Metadata } from "next";

import { CtaBanner } from "@/components/marketing/CtaBanner";
import { Faq } from "@/components/marketing/Faq";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { Section } from "@/components/marketing/Section";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guía digital para huéspedes y panel editable",
  description:
    "Manual digital para casas vacacionales y alojamientos: Wi-Fi, reglas, recomendaciones y servicios en español, inglés y francés, con un panel que editas tú.",
  alternates: { canonical: "/landing-digital" },
};

const BENEFITS = [
  {
    title: "Un QR que no cambia",
    text: "El código QR de tu pieza apunta siempre a la misma dirección. Actualizas el contenido y lo impreso sigue funcionando.",
  },
  {
    title: "Sin app que instalar",
    text: "Tus huéspedes escanean y la guía se abre en el navegador del celular, pensada para leerse rápido.",
  },
  {
    title: "La editas tú",
    text: "Desde un panel con formularios simples cambias textos, horarios, recomendaciones y enlaces. Revisas una vista previa y publicas.",
  },
  {
    title: "Con la identidad de tu propiedad",
    text: "Tu nombre, tu logo y tus colores sobre una plantilla probada para alojamientos.",
  },
] as const;

export default function DigitalGuidePage() {
  return (
    <>
      <Section
        eyebrow="La solución"
        title="La guía digital para tus huéspedes"
        description="Una página móvil con la información que tus huéspedes buscan, conectada a una pieza de bienvenida personalizada impresa en 3D. Es un manual digital de bienvenida para tu casa vacacional, cabina o alojamiento."
        tone="white"
      >
        <div className="grid gap-8 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div key={b.title} className="space-y-2">
              <h3 className="text-xl">{b.title}</h3>
              <p className="text-ink-soft">{b.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href={SITE.demoPath}>Ver demo</ButtonLink>
        </div>
      </Section>

      <Section
        eyebrow="Qué incluye"
        title="Seis módulos para tu guía"
        description="Activas solo los que necesitas. Evita publicar claves de acceso o datos sensibles en una página abierta a quien tenga el QR."
      >
        <FeatureGrid />
      </Section>

      <Section
        eyebrow="Panel del anfitrión"
        title="Edita tu guía cuando quieras"
        description="Ingresas a tu panel, cambias la información, revisas la vista previa y publicas. Sin reimprimir y sin cambiar el código QR."
        tone="white"
      />

      <Section
        eyebrow="Preguntas frecuentes"
        title="Lo que suelen preguntarnos"
      >
        <Faq />
      </Section>

      <CtaBanner
        title="¿Quieres una guía digital para tu propiedad?"
        whatsappMessage="Hola, me interesa una guía digital de emblemático para mi alojamiento."
      />
    </>
  );
}
