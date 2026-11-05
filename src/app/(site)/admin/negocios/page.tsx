import Link from "next/link";
import { Suspense } from "react";

import { AdminNotice } from "@/components/admin/ui";
import { businessStatusLabel } from "@/lib/admin/labels";
import { createClient } from "@/lib/supabase/server";

function termOf(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  return raw
    .trim()
    .replace(/[%_,.()\\]/g, "")
    .slice(0, 80);
}

function codeOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function BusinessList({
  searchParams,
}: {
  searchParams: PageProps<"/admin/negocios">["searchParams"];
}) {
  const query = await searchParams;
  const term = termOf(query.q);
  const supabase = await createClient();
  let request = supabase
    .from("businesses")
    .select("id, name, slug, status, category")
    .order("name");
  if (term) request = request.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
  const { data, error } = await request;

  return (
    <>
      <AdminNotice code={codeOf(query.aviso)} />
      <form action="/admin/negocios" className="flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">
          Buscar negocios
        </label>
        <input
          id="q"
          name="q"
          defaultValue={term}
          placeholder="Nombre o slug"
          className="border-cream-dark min-w-0 flex-1 rounded-full border bg-white px-4 py-2"
        />
        <button
          type="submit"
          className="bg-ink text-cream rounded-full px-4 py-2 text-sm"
        >
          Buscar
        </button>
      </form>
      {error ? (
        <p className="text-sm text-red-700">No pudimos cargar los negocios.</p>
      ) : data.length === 0 ? (
        <p className="text-ink-soft">No hay negocios con esa búsqueda.</p>
      ) : (
        <ul className="divide-cream-dark border-cream-dark divide-y rounded-2xl border bg-white">
          {data.map((business) => (
            <li key={business.id}>
              <Link
                href={`/admin/negocios/${business.id}`}
                className="hover:bg-cream-dark/40 flex flex-wrap items-baseline justify-between gap-2 px-4 py-3"
              >
                <span>
                  <span className="font-medium">{business.name}</span>
                  <span className="text-ink-soft"> · /{business.slug}</span>
                  {business.category ? (
                    <span className="text-ink-soft">
                      {" "}
                      · {business.category}
                    </span>
                  ) : null}
                </span>
                <span className="text-ink-soft text-sm">
                  {businessStatusLabel(business.status)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function BusinessesPage({
  searchParams,
}: PageProps<"/admin/negocios">) {
  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl">Negocios</h1>
        <Link
          href="/admin/negocios/nuevo"
          className="bg-ink text-cream rounded-full px-4 py-2 text-sm"
        >
          Nuevo negocio
        </Link>
      </div>
      <Suspense fallback={<p className="text-ink-soft">Cargando...</p>}>
        <BusinessList searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
