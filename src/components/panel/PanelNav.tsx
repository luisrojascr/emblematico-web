"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { usePanelI18n } from "@/components/panel/PanelLanguageProvider";

export function PanelNav({ businessId }: { businessId: string }) {
  const { t } = usePanelI18n();
  const pathname = usePathname();
  const base = `/panel/${businessId}`;
  const links = [
    { href: base, label: "Contenido de la guía" },
    { href: `${base}/vista-previa`, label: "Vista previa" },
    { href: `${base}/qr`, label: "Compartir y QR" },
  ] as const;

  return (
    <nav
      aria-label={t("Secciones del hospedaje")}
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
              !current && link.href.endsWith("/vista-previa") ? "xl:hidden " : ""
            }${
              current
                ? "border-sand text-ink"
                : "text-ink-soft hover:text-ink border-transparent"
            }`}
          >
            {t(link.label)}
          </Link>
        );
      })}
    </nav>
  );
}
