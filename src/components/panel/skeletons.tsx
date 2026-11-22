import type { ReactNode } from "react";

/** Pulsing placeholder block. Decorative: the wrapper announces the loading state. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-cream-dark/70 animate-pulse rounded-xl motion-reduce:animate-none ${className}`}
    />
  );
}

function PageFrame({
  narrow,
  children,
}: {
  narrow?: boolean;
  children: ReactNode;
}) {
  // Same paddings and widths as PanelPage / PanelHeading, so nothing jumps.
  return (
    <div
      className={`mx-auto px-4 py-8 sm:px-8 lg:py-12 ${narrow ? "max-w-3xl" : "max-w-5xl"}`}
    >
      {children}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="border-cream-dark overflow-hidden rounded-2xl border bg-white shadow-sm shadow-ink/5">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Title block plus a grid of property cards (home and Mis hospedajes). */
export function PanelCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <PageFrame>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <ul className="grid grid-cols-[minmax(0,20rem)] justify-center gap-4 sm:grid-cols-[repeat(auto-fill,minmax(0,20rem))] sm:justify-start">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <CardSkeleton />
          </li>
        ))}
      </ul>
    </PageFrame>
  );
}

function SectionLabel() {
  return <Skeleton className="mb-3 h-3 w-24" />;
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="border-cream-dark shadow-ink/5 rounded-2xl border bg-white shadow-sm">
      {children}
    </div>
  );
}

/** Mirrors Configuración: avatar row, account, subscription and plan list. */
export function PanelSettingsSkeleton() {
  return (
    <PageFrame narrow>
      <Skeleton className="mb-8 h-8 w-48" />
      <div className="mb-8 flex items-center gap-4">
        <Skeleton className="size-14 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
      </div>
      <section className="mb-10">
        <SectionLabel />
        <Card>
          <div className="space-y-3 p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
          <div className="border-cream-dark flex items-center justify-between gap-3 border-t p-5">
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="size-4" />
          </div>
        </Card>
      </section>
      <section className="mb-10">
        <SectionLabel />
        <Card>
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </Card>
      </section>
      <section>
        <SectionLabel />
        <div className="space-y-3">
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </section>
    </PageFrame>
  );
}

/** Mirrors Productos: owned products list, then recommended cards. */
export function PanelProductsSkeleton() {
  return (
    <PageFrame>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <section className="mb-12 space-y-4">
        <Skeleton className="h-6 w-36" />
        {Array.from({ length: 2 }, (_, i) => (
          <Card key={i}>
            <div className="flex items-center gap-4 p-4">
              <Skeleton className="size-16 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          </Card>
        ))}
      </section>
      <section className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i}>
              <Card>
                <Skeleton className="aspect-[4/3] w-full rounded-b-none" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-28 rounded-full" />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </PageFrame>
  );
}

/** Heading with cover thumbnail, tabs and a stack of editor sections. */
export function PanelEditorSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
      <Skeleton className="mb-5 h-4 w-48" />
      <div className="mb-6 flex items-center gap-4">
        <Skeleton className="size-16 shrink-0 rounded-2xl sm:size-20" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-2/3 max-w-xs" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="border-cream-dark mb-8 flex gap-6 border-b pb-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="hidden h-[640px] rounded-[2.75rem] xl:block" />
      </div>
    </div>
  );
}

/** Whole-panel fallback: shell placeholder, used before the language is known. */
export function PanelShellSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="marketing-fonts flex min-h-dvh flex-1 flex-col lg:flex-row"
    >
      <span className="sr-only">Cargando...</span>
      <div aria-hidden="true" className="bg-ink h-14 lg:h-auto lg:w-64 lg:shrink-0" />
      <div className="min-w-0 flex-1">
        <PanelCardsSkeleton />
      </div>
    </div>
  );
}
