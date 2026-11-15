import Image from "next/image";
import Link from "next/link";

import { SquareLink } from "@/components/ui/SquareButton";
import { SITE, whatsappLink } from "@/lib/site";

const EXPLORE = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: SITE.demoPath, label: "Ver demo" },
  { href: "/#planes", label: "Planes" },
] as const;

const MORE = [
  { href: "/landing-digital", label: "La solución" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/contacto", label: "Contacto" },
  { href: "/ingresar", label: "Ingresar" },
] as const;

const linkClass = "text-cream/75 hover:text-cream transition-colors";

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <nav aria-label={title}>
      <h2 className="text-sand mb-4 text-xs font-semibold tracking-[0.18em] uppercase">
        {title}
      </h2>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={linkClass}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-12 lg:px-12">
        <div className="space-y-5 sm:col-span-2 lg:col-span-1">
          <Image
            src="/brand/emblematico-logo-claro.svg"
            alt="emblemático"
            width={156}
            height={21}
            unoptimized
            className="h-9 w-auto"
          />
          <p className="text-cream/75 max-w-xs text-sm leading-relaxed">
            {SITE.tagline}
          </p>
          <SquareLink href="/contacto">Solicitar propuesta</SquareLink>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:col-span-2 lg:contents">
          <FooterLinks title="Explora" links={EXPLORE} />
          <FooterLinks title="Más" links={MORE} />
        </div>
        <div>
          <h2 className="text-sand mb-4 text-xs font-semibold tracking-[0.18em] uppercase">
            Escríbenos
          </h2>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a
                href={whatsappLink()}
                className="text-aqua font-semibold hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp +506 8899 7060
              </a>
            </li>
            <li className="text-cream/75">
              Costa Rica · Alojamientos turísticos
            </li>
          </ul>
        </div>
      </div>
      <div className="border-cream/15 text-cream/60 border-t py-5 text-center text-xs">
        © 2026 {SITE.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
