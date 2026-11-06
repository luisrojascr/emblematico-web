import Link from "next/link";
import { Suspense } from "react";

import { AdminNotice } from "@/components/admin/ui";
import { pageStatusLabel, quoteStatusLabel } from "@/lib/admin/labels";
import { createClient } from "@/lib/supabase/server";

function countBy<T extends string>(
  rows: { status: T }[] | null,
  status: T,
): number {
  return (rows ?? []).filter((row) => row.status === status).length;
}

async function Overview() {
  const supabase = await createClient();
  const [businesses, pages, quoteStatuses, recentQuotes] = await Promise.all([
    supabase.from("businesses").select("status"),
    supabase.from("pages").select("status"),
    supabase.from("quote_requests").select("status"),
    supabase
      .from("quote_requests")
      .select("id, name, status, created_at, business_type")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (
    businesses.error ||
    pages.error ||
    quoteStatuses.error ||
    recentQuotes.error
  ) {
    return (
      <p className="text-sm text-red-700">No pudimos cargar el resumen.</p>
    );
  }

  const cards = [
    ["Negocios activos", countBy(businesses.data, "active")],
    ["Suspendidos", countBy(businesses.data, "suspended")],
    ["Archivados", countBy(businesses.data, "archived")],
    ["Páginas publicadas", countBy(pages.data, "published")],
    ["Cotizaciones nuevas", countBy(quoteStatuses.data, "new")],
  ] as const;

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <li
            key={label}
            className="border-cream-dark rounded-2xl border bg-white p-4"
          >
            <p className="text-ink-soft text-sm">{label}</p>
            <p className="mt-1 text-3xl">{value}</p>
          </li>
        ))}
      </ul>
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-2xl">Cotizaciones recientes</h2>
          <Link
            href="/admin/cotizaciones"
            className="text-sand-dark text-sm underline"
          >
            Ver todas
          </Link>
        </div>
        {recentQuotes.data.length === 0 ? (
          <p className="text-ink-soft">Todavía no hay cotizaciones.</p>
        ) : (
          <ul className="divide-cream-dark border-cream-dark divide-y rounded-2xl border bg-white">
            {recentQuotes.data.map((quote) => (
              <li
                key={quote.id}
                className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3"
              >
                <span>
                  {quote.name}
                  {quote.business_type ? ` · ${quote.business_type}` : ""}
                </span>
                <span className="text-ink-soft text-sm">
                  {quoteStatusLabel(quote.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-ink-soft text-sm">
        Estados de página en el sistema: {pageStatusLabel("draft")},{" "}
        {pageStatusLabel("published")} y {pageStatusLabel("unpublished")}. El
        contenido de cada página lo edita el cliente desde su panel.
      </p>
    </>
  );
}

export default function AdminHomePage({ searchParams }: PageProps<"/admin">) {
  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-3xl">Resumen</h1>
        <Suspense fallback={null}>
          <Notice searchParams={searchParams} />
        </Suspense>
      </header>
      <Suspense fallback={<p className="text-ink-soft">Cargando...</p>}>
        <Overview />
      </Suspense>
    </section>
  );
}

async function Notice({
  searchParams,
}: {
  searchParams: PageProps<"/admin">["searchParams"];
}) {
  const query = await searchParams;
  const aviso = Array.isArray(query.aviso) ? query.aviso[0] : query.aviso;
  return <AdminNotice code={aviso} />;
}
