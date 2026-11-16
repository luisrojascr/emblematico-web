"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PanelNav({ businessId }: { businessId: string }) {
  const pathname = usePathname();
  const base = `/panel/${businessId}`;
  const links = [
    { href: base, label: "Contenido de la guía" },
    { href: `${base}/vista-previa`, label: "Vista previa" },
    { href: `${base}/qr`, label: "Compartir y QR" },
  ] as const;

  return (
    <nav
      aria-label="Secciones del hospedaje"
      className="-mb-px flex gap-6 overflow-x-auto text-sm"
    >
      {links.map((link) => {
        const current =
          link.href === base
            ? pathname === base
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={`shrink-0 border-b-2 pb-3 font-semibold transition-colors ${
              current
                ? "border-sand text-ink"
                : "text-ink-soft hover:text-ink border-transparent"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
