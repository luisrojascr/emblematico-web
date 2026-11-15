import Image from "next/image";
import Link from "next/link";

import { NavLinks } from "@/components/site/NavLinks";
import { navLinkClass } from "@/components/site/navStyles";
import { SquareLink } from "@/components/ui/SquareButton";

const linkClass = navLinkClass;

export function Header() {
  return (
    <header className="border-cream-dark bg-cream/90 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-6 sm:px-6 lg:px-12">
        <Link href="/" aria-label="emblemático, inicio" className="min-w-0 shrink">
          <Image
            src="/brand/emblematico-logo.svg"
            alt="emblemático"
            width={156}
            height={21}
            loading="eager"
            unoptimized
            className="h-6 w-auto max-w-full min-[400px]:h-7 sm:h-10"
          />
        </Link>
        <nav
          aria-label="Principal"
          className="hidden items-center gap-7 lg:flex"
        >
          <NavLinks />
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/ingresar" className={`${linkClass} px-2 py-2`}>
            Ingresar
          </Link>
          {/* Wrapper: SquareLink trae inline-flex, que le gana a "hidden". */}
          <span className="hidden sm:block">
            <SquareLink href="/contacto" className="!py-2.5">
              Solicitar propuesta
            </SquareLink>
          </span>
        </div>
      </div>
      <nav
        aria-label="Principal móvil"
        className="border-cream-dark flex gap-5 overflow-x-auto border-t px-4 py-3 lg:hidden"
      >
        <NavLinks />
      </nav>
    </header>
  );
}
