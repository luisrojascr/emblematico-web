import Link from "next/link";
import { Suspense } from "react";

import { PanelPage } from "@/components/panel/PanelPage";
import { PropertyCard } from "@/components/panel/PropertyCard";
import {
  panelCardClass,
  panelPrimaryButtonClass,
} from "@/components/panel/ui";
import { requireUser } from "@/lib/auth/session";
import { loadOverview } from "@/lib/panel/overview";

async function List({
  searchParams,
}: {
  searchParams: PageProps<"/panel/hospedajes">["searchParams"];
}) {
  const user = await requireUser();
  const query = await searchParams;
  const { properties, limit } = await loadOverview(
    user.id,
    user.role === "admin",
  );
  const canCreate = limit === null || properties.length < limit;
  const live = properties.filter((p) => p.pageStatus === "published").length;
  const limitNotice = query.aviso === "limite";

  return (
    <PanelPage
      title="Mis hospedajes"
      subtitle={
        properties.length === 0
          ? "Aún no tienes hospedajes."
          : `${properties.length} ${properties.length === 1 ? "hospedaje" : "hospedajes"}. ${live === 0 ? "Ninguno está publicado todavía." : `${live} publicado${live === 1 ? "" : "s"}.`}${limit !== null ? ` Tu plan incluye ${limit}.` : ""}`
      }
      action={
        canCreate ? (
          <Link
            href="/panel/hospedajes/nuevo"
            className={panelPrimaryButtonClass}
          >
            + Agregar hospedaje
          </Link>
        ) : null
      }
    >
      {limitNotice || !canCreate ? (
        <p role="status" className="bg-cream-dark/60 mb-6 rounded-xl px-4 py-3 text-sm">
          Ya usaste los hospedajes de tu plan.{" "}
          <Link href="/contacto" className="text-teal-deep font-semibold underline">
            Escríbenos para ampliarlo
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
              <span className="text-2xl" aria-hidden="true">+</span>
              <span className="font-semibold">Agregar hospedaje</span>
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
    <Suspense fallback={<p className="text-ink-soft p-8">Cargando...</p>}>
      <List searchParams={searchParams} />
    </Suspense>
  );
}
