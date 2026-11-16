import Link from "next/link";
import { Suspense } from "react";

import { PanelPage } from "@/components/panel/PanelPage";
import { PropertyCard } from "@/components/panel/PropertyCard";
import {
  panelCardClass,
  panelPrimaryButtonClass,
  panelSecondaryButtonClass,
} from "@/components/panel/ui";
import { requireUser } from "@/lib/auth/session";
import { loadOverview } from "@/lib/panel/overview";

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Costa_Rica",
    }).format(new Date()),
  );
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

async function Home() {
  const user = await requireUser();
  const { properties, limit } = await loadOverview(
    user.id,
    user.role === "admin",
  );
  const first =
    user.fullName?.trim().split(/\s+/)[0] ||
    user.email?.split("@")[0] ||
    "";
  const canCreate = limit === null || properties.length < limit;

  return (
    <PanelPage title={first ? `${greeting()}, ${first}` : greeting()}>
      {properties.length === 0 ? (
        <section
          className={`${panelCardClass} flex flex-col items-center px-6 py-14 text-center`}
        >
          <span className="bg-cream text-teal-deep mb-5 flex size-16 items-center justify-center rounded-2xl">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 11.5 12 4l9 7.5" />
              <path d="M5.5 10v9.5h13V10" />
              <path d="M12 12.5v4M10 14.5h4" />
            </svg>
          </span>
          <h2 className="text-2xl">Crea tu primera guía</h2>
          <p className="text-ink-soft mt-2 max-w-md">
            Una página que tus huéspedes abren al escanear un código en la
            pared. Empieza con el nombre: lo demás puede esperar.
          </p>
          {canCreate ? (
            <Link
              href="/panel/hospedajes/nuevo"
              className={`${panelPrimaryButtonClass} mt-6`}
            >
              + Crear guía
            </Link>
          ) : (
            <p className="text-ink-soft mt-6 text-sm">
              Tu plan no incluye más hospedajes. Escríbenos para ampliarlo.
            </p>
          )}
          <p className="text-ink-soft mt-4 text-xs">
            Toma cerca de un minuto. Tu código funciona desde que existe la guía.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl">Tus hospedajes</h2>
            <Link href="/panel/hospedajes" className={panelSecondaryButtonClass}>
              Ver todos
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.slice(0, 6).map((property) => (
              <li key={property.id}>
                <PropertyCard property={property} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </PanelPage>
  );
}

export default function PanelHomePage() {
  return (
    <Suspense fallback={<p className="text-ink-soft p-8">Cargando...</p>}>
      <Home />
    </Suspense>
  );
}
