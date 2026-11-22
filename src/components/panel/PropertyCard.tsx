import Link from "next/link";

import { getPanelI18n } from "@/lib/panel/i18n-server";
import { mediaUrl } from "@/lib/catalog/media";
import type { PanelProperty } from "@/lib/panel/overview";
import { businessPublicUrl } from "@/lib/qr/render";

import {
  panelCardClass,
  panelPrimaryButtonClass,
  panelSecondaryButtonClass,
} from "./ui";

const STATE: Record<string, string> = {
  draft: "Borrador",
  published: "Publicada",
  unpublished: "Fuera de línea",
};

// Same height and no wrapping on every button; the label never gets cut.
const button = "min-h-11 whitespace-nowrap text-sm";

export async function PropertyCard({ property }: { property: PanelProperty }) {
  const { t } = await getPanelI18n();
  const published = property.pageStatus === "published";
  const inactive = property.status !== "active";
  const paused = !inactive && property.paused;
  const live = published && !inactive && !paused;
  const status = inactive
    ? property.status === "suspended"
      ? t("Suspendido")
      : t("Archivado")
    : paused
      ? t("En pausa por el plan")
      : property.pageStatus
        ? t(STATE[property.pageStatus]!)
        : t("Sin borrador");
  return (
    <article className={`${panelCardClass} flex flex-col overflow-hidden`}>
      <Link
        href={`/panel/${property.id}`}
        tabIndex={-1}
        aria-hidden="true"
        className="bg-cream-dark/60 relative block aspect-[16/9] w-full overflow-hidden"
      >
        {property.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(property.coverPath)}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-teal/50 flex h-full items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              width="40"
              height="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 11.5 12 4l9 7.5" />
              <path d="M5.5 10v9.5h13V10" />
            </svg>
          </div>
        )}
      </Link>
      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <h3 className="text-lg leading-tight">{property.name}</h3>
          <p className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${live ? "bg-teal" : "bg-sand"}`}
            />
            <span
              className={live ? "text-teal-deep font-semibold" : "text-ink-soft"}
            >
              {status}
            </span>
          </p>
        </div>
        <div className="space-y-2">
          <Link
            href={`/panel/${property.id}`}
            className={`${panelPrimaryButtonClass} ${button} w-full`}
          >
            {t("Editar guía")}
          </Link>
          <div
            className={`grid gap-2 ${published && !inactive ? "grid-cols-2" : ""}`}
          >
            <Link
              href={`/panel/${property.id}/qr`}
              className={`${panelSecondaryButtonClass} ${button}`}
            >
              {t("Código QR")}
            </Link>
            {published && !inactive ? (
              <a
                href={businessPublicUrl(property.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${panelSecondaryButtonClass} ${button}`}
              >
                {t("Ver guía ↗")}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
