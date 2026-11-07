import Image from "next/image";
import Link from "next/link";

const NAV = [
  { href: "/productos", label: "Productos" },
  { href: "/landing-digital", label: "Landing digital" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
] as const;

export function Header() {
  return (
    <header className="border-cream-dark bg-cream/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="emblemático, inicio">
          <Image
            src="/brand/logo-gold.png"
            alt="emblemático"
            width={156}
            height={32}
            loading="eager"
            className="h-8 w-auto"
          />
        </Link>
        <nav aria-label="Principal" className="hidden gap-8 text-sm lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-ink-soft hover:text-ink transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/contacto"
          className="bg-ink text-cream hover:bg-sand-dark rounded-full px-4 py-2 text-sm font-medium transition-colors"
        >
          Cotizar
        </Link>
      </div>
      <nav
        aria-label="Principal móvil"
        className="border-cream-dark flex gap-5 overflow-x-auto border-t px-4 py-2 text-sm lg:hidden"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-ink-soft whitespace-nowrap"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
