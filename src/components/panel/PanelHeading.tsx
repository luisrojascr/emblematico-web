import Link from "next/link";
import type { ReactNode } from "react";

import { getPanelI18n } from "@/lib/panel/i18n-server";
import { mediaUrl } from "@/lib/catalog/media";
import type { PanelPage } from "@/lib/panel/load";
import { coverOf } from "@/lib/panel/overview";
import { businessPublicUrl } from "@/lib/qr/render";

import { PanelNav } from "./PanelNav";
import { panelSecondaryButtonClass } from "./ui";

const STATUS: Record<
  PanelPage["pageStatus"],
  { label: string; live: boolean }
> = {
  published: { label: "Guía publicada", live: true },
  draft: { label: "Borrador sin publicar", live: false },
  unpublished: { label: "Fuera de línea", live: false },
};

export async function PanelHeading({
  page,
  wide,
  children,
}: {
  page: PanelPage;
  wide?: boolean;
  children: ReactNode;
}) {
  const { t } = await getPanelI18n();
  const publicUrl = businessPublicUrl(page.slug);
  const cover = coverOf(page.draft);
  const status = STATUS[page.pageStatus];

  return (
    <div
      className={`mx-auto px-4 py-8 sm:px-8 lg:py-10 ${wide ? "max-w-6xl" : "max-w-3xl"}`}
    >
      <nav aria-label={t("Ruta")} className="text-ink-soft mb-5 text-sm">
        <Link href="/panel/hospedajes" className="hover:text-ink">
          {t("Mis hospedajes")}
        </Link>
        <span aria-hidden="true"> › </span>
        <span className="text-ink">{page.name}</span>
      </nav>

      <header className="mb-6 flex flex-wrap items-center gap-4">
        <div className="bg-cream-dark size-16 shrink-0 overflow-hidden rounded-2xl sm:size-20">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(cover)}
              alt=""
              className="size-full object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl sm:text-3xl">{page.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${status.live ? "bg-teal" : "bg-sand"}`}
            />
            <span
              className={
                status.live ? "text-teal-deep font-semibold" : "text-ink-soft"
              }
            >
              {t(status.label)}
            </span>
          </p>
        </div>
        {page.pageStatus === "published" ? (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={panelSecondaryButtonClass}
          >
            {t("Abrir guía ↗")}
          </a>
        ) : null}
      </header>

      <div className="border-cream-dark mb-8 border-b">
        <PanelNav businessId={page.id} />
      </div>
      {children}
    </div>
  );
}
