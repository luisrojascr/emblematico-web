import Image from "next/image";
import Link from "next/link";

import { SITE, whatsappLink } from "@/lib/site";

const LINKS = [
  { href: "/productos", label: "Productos" },
  { href: "/landing-digital", label: "La solución" },
  { href: "/como-funciona", label: "Funciones" },
  { href: "/contacto", label: "Contacto" },
  { href: "/ingresar", label: "Ingresar" },
] as const;

export function Footer() {
  return (
    <footer className="bg-cream border-cream-dark text-ink border-t">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-12">
        <div className="space-y-4">
          <Image
            src="/brand/logo-black.png"
            alt="emblemático"
            width={156}
            height={32}
            className="h-8 w-auto"
          />
          <p className="text-ink-soft max-w-xs text-sm">{SITE.tagline}</p>
        </div>
        <nav aria-label="Pie de página" className="space-y-2 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-ink-soft hover:text-ink block"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 text-sm">
          <p className="text-ink-soft">Costa Rica · Alojamientos turísticos</p>
          <a
            href={whatsappLink()}
            className="text-sand-dark font-medium hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp +506 8899 7060
          </a>
        </div>
      </div>
      <div className="border-cream-dark text-ink-soft border-t py-4 text-center text-xs">
        © 2026 {SITE.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
