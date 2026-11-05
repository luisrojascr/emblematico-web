import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

async function BusinessList() {
  const supabase = await createClient();
  // RLS limits this to the businesses the user belongs to.
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, status")
    .order("name");

  if (!businesses?.length) {
    return <p className="text-ink-soft">Aún no tienes negocios asignados.</p>;
  }

  return (
    <ul className="space-y-2">
      {businesses.map((b) => (
        <li
          key={b.id}
          className="border-cream-dark rounded-lg border bg-white px-4 py-3"
        >
          {b.name}
        </li>
      ))}
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
