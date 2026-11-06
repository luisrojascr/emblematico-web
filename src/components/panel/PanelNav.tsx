"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PanelNav({
  businessId,
  publicUrl,
}: {
  businessId: string;
  publicUrl: string;
}) {
  const pathname = usePathname();
  const base = `/panel/${businessId}`;
  const links = [
    { href: base, label: "Editar" },
    { href: `${base}/vista-previa`, label: "Vista previa" },
    { href: `${base}/qr`, label: "Código QR" },
  ] as const;

  return (
    <nav
      aria-label="Página del negocio"
      className="flex flex-wrap gap-4 text-sm"
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
            className={
              current
                ? "text-sand-dark font-medium"
                : "text-ink-soft hover:text-ink"
            }
          >
            {link.label}
          </Link>
        );
      })}
      <a
        href={publicUrl}
        className="text-ink-soft hover:text-ink"
        target="_blank"
        rel="noopener noreferrer"
      >
        Ver publicada
      </a>
    </nav>
  );
}
