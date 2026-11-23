"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { usePanelI18n } from "@/components/panel/PanelLanguageProvider";
import { PanelLanguageSwitcher } from "./PanelLanguageSwitcher";

type Item = {
  href: string;
  label: string;
  /** Short label for the mobile tab bar. */
  short: string;
  icon: ReactNode;
  match: (p: string) => boolean;
};

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
    short: "Inicio",
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
    short: "Hospedajes",
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
    short: "Productos",
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
    short: "Cuenta",
    icon: icon(
      <>
        <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="10" cy="12" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>,
    ),
    match: (p) =>
      p.startsWith("/panel/configuracion") || p === "/panel/contrasena",
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
  const { t } = usePanelI18n();
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
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-semibold transition-colors lg:min-h-0 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-xl lg:px-3 lg:py-2.5 lg:text-sm ${
              current
                ? "text-teal-deep lg:bg-cream/10 lg:text-sand"
                : "text-ink-soft lg:text-cream/80 lg:hover:bg-cream/5 lg:hover:text-cream"
            }`}
          >
            {item.icon}
            <span className="lg:hidden">{t(item.short)}</span>
            <span className="hidden lg:inline">{t(item.label)}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <aside className="bg-ink text-cream lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col">
      <div className="flex items-center justify-between gap-4 px-4 py-4 lg:block lg:px-6 lg:py-7">
        <Link href="/panel" aria-label={t("emblemático, inicio del panel")}>
          <Image
            src="/brand/emblematico-logo-claro.svg"
            alt={"emblemático"}
            width={156}
            height={21}
            unoptimized
            className="h-6 w-auto"
          />
        </Link>
        <div className="flex items-center gap-3 lg:hidden">
          <PanelLanguageSwitcher />
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-cream/70 text-xs underline">
              {t("Salir")}
            </button>
          </form>
        </div>
      </div>

      <nav
        aria-label={t("Panel")}
        className="border-ink/10 fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-white pb-[env(safe-area-inset-bottom)] lg:static lg:flex lg:flex-1 lg:flex-col lg:gap-1 lg:border-0 lg:bg-transparent lg:px-3 lg:pb-0"
      >
        {links}
      </nav>

      <div className="border-cream/10 hidden border-t px-4 py-3 lg:block">
        <PanelLanguageSwitcher />
      </div>

      <div className="border-cream/10 hidden space-y-3 border-t p-4 lg:block">
        {isAdmin ? (
          <Link
            href="/admin"
            className="text-cream/70 hover:text-cream block px-2 text-sm"
          >
            {t("Administración")}
          </Link>
        ) : null}
        <div className="px-2">
          <p className="truncate text-sm font-semibold">{name}</p>
          {email ? (
            <p className="text-cream/60 truncate text-xs">{email}</p>
          ) : null}
        </div>
        <form action="/auth/signout" method="post" className="px-2">
          <button
            type="submit"
            className="text-cream/70 hover:text-cream text-sm underline"
          >
            {t("Cerrar sesión")}
          </button>
        </form>
      </div>
    </aside>
  );
}
