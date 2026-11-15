/** El sitio publicado. La demo siempre muestra la guía de aquí, también en local. */
const PRODUCTION_ORIGIN = "https://www.emblematicocr.com";
const DEMO_GUIDE_PATH = "/negocio/casa-nebora";

export const SITE = {
  // Brand name is always lowercase.
  name: "emblemático",
  tagline: "Una mejor bienvenida para tu alojamiento.",
  description:
    "Guía digital para huéspedes en español, inglés y francés, conectada a una pieza de bienvenida impresa en 3D. Soluciones para alojamientos turísticos independientes en Costa Rica.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? PRODUCTION_ORIGIN,
  productionOrigin: PRODUCTION_ORIGIN,
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "50688997060",
  /** Página de demostración del sitio (muestra la guía en un teléfono). */
  demoPath: "/demo",
  /** Guía demo ficticia, publicada como una página de cliente más. */
  demoGuidePath: DEMO_GUIDE_PATH,
  /** La guía demo en producción: es la que carga el teléfono de /demo. */
  demoGuideUrl: `${PRODUCTION_ORIGIN}${DEMO_GUIDE_PATH}`,
} as const;

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${SITE.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
