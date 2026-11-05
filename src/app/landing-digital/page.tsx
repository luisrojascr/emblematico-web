import type { Metadata } from "next";

import { CtaBanner } from "@/components/marketing/CtaBanner";
import { Section } from "@/components/marketing/Section";

export const metadata: Metadata = {
  title: "Landing digital",
  description:
    "Una página móvil con tu marca conectada a tu QR. Actualizas la información cuando quieras y el QR nunca cambia.",
  alternates: { canonical: "/landing-digital" },
};

const BENEFITS = [
  {
    title: "Un QR permanente",
    text: "Tu código QR apunta siempre a la misma dirección. Si cambias el contenido, o incluso el nombre de tu negocio, lo impreso sigue funcionando.",
  },
  {
    title: "Hecha para el celular",
    text: "Diseño móvil, rápido y claro. Tus huéspedes y clientes encuentran lo importante en segundos, sin descargar nada.",
  },
  {
    title: "La editas tú",
    text: "Desde un panel con formularios simples cambias textos, fotos, horarios y enlaces. Revisas una vista previa y publicas cuando estés listo.",
  },
  {
    title: "Con tu identidad",
    text: "Tu logo, tus colores y tu información sobre una plantilla probada, sin tener que construir un sitio web desde cero.",
  },
] as const;

const TEMPLATES = [
  {
    name: "Hospedaje",
    sections: [
      "Nombre y logo de la propiedad",
      "Mensaje de bienvenida",
      "Información del Wi-Fi",
      "Check-in y check-out",
      "Reglas de la casa",
      "Amenidades e instrucciones",
      "Contacto por WhatsApp",
      "Recomendaciones y enlaces útiles",
    ],
  },
  {
    name: "Negocio general",
    sections: [
      "Nombre y logo del negocio",
      "Descripción",
      "Ubicación y horarios",
      "Contacto por WhatsApp",
      "Enlace a reseñas de Google",
      "Instagram y otras redes",
      "Menú, catálogo o sitio web",
      "Botón de acción principal",
    ],
  },
] as const;

const FAQ = [
  {
    q: "¿Necesito saber de tecnología?",
    a: "No. Editas con formularios simples, sin tocar código. Si prefieres, nosotros dejamos todo listo por ti.",
  },
  {
    q: "¿Qué pasa si cambio algo de mi negocio?",
    a: "Actualizas la información en tu panel y publicas. El QR impreso sigue llevando a tu página, ahora con los datos nuevos.",
  },
  {
    q: "¿Todas las secciones son obligatorias?",
    a: "No. Activas solo las secciones que necesitas y ocultas las demás.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "Depende de los productos y del servicio de hospedaje de tu página. Escríbenos y te preparamos una cotización.",
  },
] as const;

export default function DigitalLandingPage() {
  return (
    <>
      <Section
        eyebrow="Landing digital"
        title="La parte digital de tus productos con QR"
        description="Cada producto con QR de emblemático puede conectarse a una página móvil con tu marca. Es el puente entre tu espacio físico y la información que tus visitantes necesitan."
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
      </Section>

      <Section
        eyebrow="Plantillas"
        title="Dos plantillas, listas para usar"
        description="Cada una incluye las secciones que más se necesitan. Tú decides cuáles mostrar."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {TEMPLATES.map((t) => (
            <div
              key={t.name}
              className="border-cream-dark rounded-2xl border bg-white p-6"
            >
              <h3 className="mb-4 text-2xl">{t.name}</h3>
              <ul className="text-ink-soft space-y-2">
                {t.sections.map((s) => (
                  <li key={s}>✓ {s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Preguntas frecuentes"
        title="Lo que suelen preguntarnos"
        tone="white"
      >
        <dl className="grid gap-8 md:grid-cols-2">
          {FAQ.map((item) => (
            <div key={item.q} className="space-y-2">
              <dt className="font-serif text-xl">{item.q}</dt>
              <dd className="text-ink-soft">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <CtaBanner
        title="¿Quieres una landing para tu negocio?"
        whatsappMessage="Hola, me interesa una landing digital con QR de emblemático para mi negocio."
      />
    </>
  );
}
