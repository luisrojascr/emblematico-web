"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/negocios", label: "Negocios" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/cotizaciones", label: "Cotizaciones" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Administración"
      className="flex gap-4 overflow-x-auto text-sm"
    >
      {LINKS.map((link) => {
        const current =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={
              current
                ? "text-sand font-medium"
                : "text-cream/80 hover:text-cream"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
