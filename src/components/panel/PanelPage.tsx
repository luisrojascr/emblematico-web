import type { ReactNode } from "react";

/** Contenedor de las pantallas del panel: migas, título y acción principal. */
export function PanelPage({
  crumbs,
  title,
  subtitle,
  action,
  children,
  narrow,
}: {
  crumbs?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className={`mx-auto px-4 py-8 sm:px-8 lg:py-12 ${narrow ? "max-w-3xl" : "max-w-5xl"}`}>
      {crumbs ? <div className="text-ink-soft mb-3 text-sm">{crumbs}</div> : null}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">{title}</h1>
          {subtitle ? <p className="text-ink-soft mt-1">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
