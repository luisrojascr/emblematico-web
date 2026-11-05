import Image from "next/image";
import Link from "next/link";

import { SITE, whatsappLink } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-4">
          <Image
            src="/brand/logo-cream.png"
            alt="emblemático"
            width={1853}
            height={379}
            className="h-8 w-auto"
          />
          <p className="text-cream/70 max-w-xs text-sm">{SITE.tagline}</p>
        </div>
        <nav aria-label="Pie de página" className="space-y-2 text-sm">
          <Link
            href="/productos"
            className="text-cream/80 hover:text-sand block"
          >
            Productos
          </Link>
          <Link
            href="/landing-digital"
            className="text-cream/80 hover:text-sand block"
          >
            Landing digital
          </Link>
          <Link
            href="/como-funciona"
            className="text-cream/80 hover:text-sand block"
          >
            Cómo funciona
          </Link>
          <Link
            href="/nosotros"
            className="text-cream/80 hover:text-sand block"
          >
            Nosotros
          </Link>
        </nav>
        <div className="space-y-2 text-sm">
          <p className="text-cream/60">Costa Rica</p>
          <a
            href={whatsappLink()}
            className="text-sand hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp +506 8899 7060
          </a>
        </div>
      </div>
      <div className="border-cream/10 text-cream/50 border-t py-4 text-center text-xs">
        © 2026 {SITE.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
