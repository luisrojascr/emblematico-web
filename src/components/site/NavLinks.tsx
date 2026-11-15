"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { SITE } from "@/lib/site";

import { navLinkClass } from "./navStyles";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: SITE.demoPath, label: "Ver demo" },
  { href: "/#planes", label: "Planes" },
  { href: "/contacto", label: "Contacto" },
] as const;

const activeClass =
  "text-ink! after:bg-sand relative after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5 after:rounded-full";

/**
 * Activo si estás en esa página o dentro de ella (/productos/... marca Productos).
 * "Planes" es un ancla del inicio, así que no se marca: Inicio ya lo cubre.
 */
function isActive(href: string, pathname: string): boolean {
  if (href.includes("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItems({ pathname }: { pathname: string | null }) {
  return NAV.map((item) => {
    const active = pathname !== null && isActive(item.href, pathname);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`${navLinkClass} ${active ? activeClass : ""}`}
      >
        {item.label}
      </Link>
    );
  });
}

function ActiveNavItems() {
  return <NavItems pathname={usePathname()} />;
}

/**
 * La ruta actual es dato de la URL: con cacheComponents debe ir dentro de
 * Suspense. Mientras tanto se muestran los mismos enlaces sin marcar.
 */
export function NavLinks() {
  return (
    <Suspense fallback={<NavItems pathname={null} />}>
      <ActiveNavItems />
    </Suspense>
  );
}
