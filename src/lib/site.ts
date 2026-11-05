export const SITE = {
  // Brand name is always lowercase.
  name: "emblemático",
  tagline: "Diseño y soluciones que distinguen tu negocio.",
  description:
    "Productos personalizados impresos en 3D y páginas digitales con QR para hoteles, restaurantes y negocios en Costa Rica.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.emblematicocr.com",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "50688997060",
} as const;

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${SITE.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
