import Link from "next/link";
import { Suspense } from "react";

import { getPanelI18n } from "@/lib/panel/i18n-server";
import { PanelLoading } from "@/components/panel/PanelLanguageProvider";
import { PanelPage } from "@/components/panel/PanelPage";
import { PropertyCard } from "@/components/panel/PropertyCard";
import { panelCardClass, panelPrimaryButtonClass } from "@/components/panel/ui";
import { requireUser } from "@/lib/auth/session";
import { loadOverview } from "@/lib/panel/overview";

async function List({
  searchParams,
}: {
  searchParams: PageProps<"/panel/hospedajes">["searchParams"];
}) {
  const { t } = await getPanelI18n();
  const user = await requireUser();
  const query = await searchParams;
  const { properties, limit, owned, canCreate } = await loadOverview(
    user.id,
    user.role === "admin",
  );
  const live = properties.filter((p) => p.pageStatus === "published").length;
  const limitNotice = query.aviso === "limite";

  return (
    <PanelPage
      title={t("Mis hospedajes")}
      subtitle={
        properties.length === 0
          ? t("Aún no tienes hospedajes.")
          : [
              t(
                properties.length === 1
                  ? "1 hospedaje."
                  : "{count} hospedajes.",
                { count: properties.length },
              ),
              live === 0
                ? t("Ninguno está publicado todavía.")
                : t(live === 1 ? "1 publicado." : "{count} publicados.", {
                    count: live,
                  }),
              limit !== null
                ? t(
                    "Tu plan incluye {limit} hospedajes propios (tienes {owned}).",
                    { limit, owned },
                  )
                : "",
            ]
              .filter(Boolean)
              .join(" ")
      }
      action={
        canCreate ? (
          <Link
            href="/panel/hospedajes/nuevo"
            className={panelPrimaryButtonClass}
          >
            {t("+ Agregar hospedaje")}
          </Link>
        ) : null
      }
    >
      {limitNotice || !canCreate ? (
        <p
          role="status"
          className="bg-cream-dark/60 mb-6 rounded-xl px-4 py-3 text-sm"
        >
          {t("Ya usaste los hospedajes de tu plan.")}{" "}
          <Link
            href="/contacto"
            className="text-teal-deep font-semibold underline"
          >
            {t("Escríbenos para ampliarlo")}
          </Link>
          .
        </p>
      ) : null}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <li key={property.id}>
            <PropertyCard property={property} />
          </li>
        ))}
        {canCreate ? (
          <li>
            <Link
              href="/panel/hospedajes/nuevo"
              className={`${panelCardClass} border-ink/20 text-ink-soft hover:text-ink flex h-full min-h-40 flex-col items-center justify-center gap-2 border-dashed p-6 text-center transition-colors`}
            >
              <span className="text-2xl" aria-hidden="true">
                +
              </span>
              <span className="font-semibold">{t("Agregar hospedaje")}</span>
            </Link>
          </li>
        ) : null}
      </ul>
    </PanelPage>
  );
}

export default function PropertiesPage({
  searchParams,
}: PageProps<"/panel/hospedajes">) {
  return (
    <Suspense fallback={<PanelLoading />}>
      <List searchParams={searchParams} />
    </Suspense>
  );
}
