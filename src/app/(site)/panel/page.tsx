import Link from "next/link";
import { Suspense } from "react";

import { businessStatusLabel, pageStatusLabel } from "@/lib/admin/labels";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATE_LABELS } from "@/lib/templates/registry";

async function BusinessList() {
  const supabase = await createClient();
  const [{ data: businesses }, { data: pages }] = await Promise.all([
    supabase.from("businesses").select("id, name, status").order("name"),
    supabase.from("pages").select("business_id, status, template_key"),
  ]);
  const byBusiness = new Map(
    (pages ?? []).map((page) => [page.business_id, page]),
  );

  if (!businesses?.length) {
    return <p className="text-ink-soft">Aún no tienes negocios asignados.</p>;
  }

  return (
    <ul className="space-y-3">
      {businesses.map((business) => {
        const page = byBusiness.get(business.id);
        return (
          <li key={business.id}>
            <Link
              href={`/panel/${business.id}`}
              className="border-cream-dark hover:border-sand block rounded-lg border bg-white px-4 py-3"
            >
              <span className="block font-medium">{business.name}</span>
              <span className="text-ink-soft text-sm">
                {page ? TEMPLATE_LABELS[page.template_key] : "Sin página"}
                {" · "}
                {page ? pageStatusLabel(page.status) : "Sin borrador"}
                {" · "}
                {businessStatusLabel(business.status)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function PanelPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="mb-6 text-3xl">Mis negocios</h1>
      <Suspense fallback={<p className="text-ink-soft">Cargando...</p>}>
        <BusinessList />
      </Suspense>
    </section>
  );
}
