"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Item = { href: string; label: string; icon: ReactNode; match: (p: string) => boolean };

const icon = (path: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {path}
  </svg>
);

const ITEMS: readonly Item[] = [
  {
    href: "/panel",
    label: "Inicio",
    icon: icon(
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>,
    ),
    match: (p) => p === "/panel",
  },
  {
    href: "/panel/hospedajes",
    label: "Mis hospedajes",
    icon: icon(
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v9.5h13V10" />
        <path d="M10 19.5v-5h4v5" />
      </>,
    ),
    match: (p) =>
      p !== "/panel" &&
      p !== "/panel/contrasena" &&
      !p.startsWith("/panel/productos") &&
      !p.startsWith("/panel/configuracion"),
  },
  {
    href: "/panel/productos",
    label: "Productos",
    icon: icon(
      <>
        <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
        <path d="m3 8 9 5 9-5M12 13v8" />
      </>,
    ),
    match: (p) => p.startsWith("/panel/productos"),
  },
  {
    href: "/panel/configuracion",
    label: "Configuración",
    icon: icon(
      <>
        <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="10" cy="12" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>,
    ),
    match: (p) => p.startsWith("/panel/configuracion") || p === "/panel/contrasena",
  },
];

export function PanelSidebar({
  name,
  email,
  isAdmin,
}: {
  name: string;
  email: string | null;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const links = (
    <>
      {ITEMS.map((item) => {
        const current = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              current
                ? "bg-cream/10 text-sand"
                : "text-cream/80 hover:bg-cream/5 hover:text-cream"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <aside className="bg-ink text-cream lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col">
      <div className="flex items-center justify-between gap-4 px-4 py-4 lg:block lg:px-6 lg:py-7">
        <Link href="/panel" aria-label="emblemático, inicio del panel">
          <Image
            src="/brand/emblematico-logo-claro.svg"
            alt="emblemático"
            width={156}
            height={21}
            unoptimized
            className="h-6 w-auto"
          />
        </Link>
        <div className="flex items-center gap-3 lg:hidden">
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-cream/70 text-xs underline">
              Salir
            </button>
          </form>
        </div>
      </div>

      <nav
        aria-label="Panel"
        className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0"
      >
        {links}
      </nav>

      <div className="hidden space-y-3 border-t border-cream/10 p-4 lg:block">
        {isAdmin ? (
          <Link
            href="/admin"
            className="text-cream/70 hover:text-cream block px-2 text-sm"
          >
            Administración
          </Link>
        ) : null}
        <div className="px-2">
          <p className="truncate text-sm font-semibold">{name}</p>
          {email ? (
            <p className="text-cream/60 truncate text-xs">{email}</p>
          ) : null}
        </div>
        <form action="/auth/signout" method="post" className="px-2">
          <button type="submit" className="text-cream/70 hover:text-cream text-sm underline">
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
