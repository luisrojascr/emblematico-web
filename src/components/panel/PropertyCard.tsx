import Link from "next/link";

import { getPanelI18n } from "@/lib/panel/i18n-server";
import { mediaUrl } from "@/lib/catalog/media";
import type { PanelProperty } from "@/lib/panel/overview";

import { panelCardClass } from "./ui";

const STATE: Record<string, string> = {
  draft: "Borrador",
  published: "Publicada",
  unpublished: "Fuera de línea",
};

export async function PropertyCard({ property }: { property: PanelProperty }) {
  const { t } = await getPanelI18n();
  const published = property.pageStatus === "published";
  const inactive = property.status !== "active";
  const paused = !inactive && property.paused;
  return (
    <Link
      href={`/panel/${property.id}`}
      className={`${panelCardClass} group hover:border-teal/40 flex flex-col overflow-hidden transition-colors`}
    >
      <div className="bg-cream-dark/60 aspect-[16/9] w-full overflow-hidden">
        {property.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(property.coverPath)}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
      </div>
      <div className="space-y-2 p-4">
        <h3 className="text-lg leading-tight">{property.name}</h3>
        <p className="flex items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${published && !inactive && !paused ? "bg-teal" : "bg-sand"}`}
          />
          <span className="text-ink-soft">
            {inactive
              ? property.status === "suspended"
                ? t("Suspendido")
                : t("Archivado")
              : paused
                ? t("En pausa por el plan")
                : property.pageStatus
                  ? t(STATE[property.pageStatus]!)
                  : t("Sin borrador")}
          </span>
        </p>
      </div>
    </Link>
  );
}
