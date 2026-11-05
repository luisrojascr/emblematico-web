import Link from "next/link";
import { Suspense } from "react";

import { CategoryForm, ProductForm } from "@/components/admin/CatalogForms";
import { AdminNotice, secondaryButtonClass } from "@/components/admin/ui";
import {
  reorderCategory,
  reorderProduct,
} from "@/app/(site)/admin/productos/actions";
import { createClient } from "@/lib/supabase/server";

function codeOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function Catalog({
  searchParams,
}: {
  searchParams: PageProps<"/admin/productos">["searchParams"];
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("product_categories")
      .select("*")
      .order("sort_order")
      .order("name"),
    supabase.from("products").select("*").order("sort_order").order("name"),
  ]);

  return (
    <>
      <AdminNotice code={codeOf(query.aviso)} />
      <section className="border-cream-dark rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-2xl">Nueva categoría</h2>
        <CategoryForm />
      </section>
      <section className="border-cream-dark rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-2xl">Nuevo producto</h2>
        <ProductForm
          categories={(categories ?? []).map((category) => ({
            id: category.id,
            name: category.name,
          }))}
        />
      </section>
      <div className="space-y-6">
        {(categories ?? []).map((category) => {
          const items = (products ?? []).filter(
            (product) => product.category_id === category.id,
          );
          return (
            <section
              key={category.id}
              className="border-cream-dark space-y-4 rounded-2xl border bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl">{category.name}</h2>
                <div className="flex gap-2">
                  <form action={reorderCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      className={secondaryButtonClass}
                      aria-label={`Subir ${category.name}`}
                    >
                      Subir
                    </button>
                  </form>
                  <form action={reorderCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      className={secondaryButtonClass}
                      aria-label={`Bajar ${category.name}`}
                    >
                      Bajar
                    </button>
                  </form>
                </div>
              </div>
              <details>
                <summary className="cursor-pointer text-sm underline">
                  Editar categoría
                </summary>
                <div className="mt-4">
                  <CategoryForm
                    category={{
                      id: category.id,
                      name: category.name,
                      slug: category.slug,
                      description: category.description ?? "",
                      imagePath: category.image_path,
                    }}
                  />
                </div>
              </details>
              <ul className="divide-cream-dark divide-y">
                {items.map((product) => (
                  <li
                    key={product.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <Link
                      href={`/admin/productos/${product.id}`}
                      className="hover:underline"
                    >
                      {product.name}
                      {!product.is_active ? " · oculto" : ""}
                    </Link>
                    <div className="flex gap-2">
                      <form action={reorderProduct}>
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          className={secondaryButtonClass}
                          aria-label={`Subir ${product.name}`}
                        >
                          Subir
                        </button>
                      </form>
                      <form action={reorderProduct}>
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          className={secondaryButtonClass}
                          aria-label={`Bajar ${product.name}`}
                        >
                          Bajar
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

export default function ProductsPage({
  searchParams,
}: PageProps<"/admin/productos">) {
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="text-3xl">Productos</h1>
      <Suspense fallback={<p className="text-ink-soft">Cargando...</p>}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
