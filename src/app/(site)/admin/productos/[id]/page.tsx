import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { ProductForm } from "@/components/admin/CatalogForms";
import { AdminNotice } from "@/components/admin/ui";
import { isStoredCatalogImage } from "@/lib/admin/images";
import { createClient } from "@/lib/supabase/server";

function codeOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function Editor({
  id,
  searchParams,
}: {
  id: string;
  searchParams: PageProps<"/admin/productos/[id]">["searchParams"];
}) {
  if (!z.uuid().safeParse(id).success) notFound();
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("product_categories").select("id, name").order("sort_order"),
  ]);
  if (!product) notFound();
  const image = product.images.find(isStoredCatalogImage) ?? null;

  return (
    <>
      <AdminNotice code={codeOf(query.aviso)} />
      <h1 className="text-3xl">{product.name}</h1>
      <div className="border-cream-dark rounded-2xl border bg-white p-5">
        <ProductForm
          categories={categories ?? []}
          product={{
            id: product.id,
            categoryId: product.category_id,
            name: product.name,
            slug: product.slug,
            summary: product.summary ?? "",
            description: product.description ?? "",
            isActive: product.is_active,
            imagePath: image,
          }}
        />
      </div>
      <Link
        href="/admin/productos"
        className="text-sand-dark text-sm underline"
      >
        Volver a productos
      </Link>
    </>
  );
}

export default function ProductPage({
  params,
  searchParams,
}: PageProps<"/admin/productos/[id]">) {
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
      <Suspense fallback={<p className="text-ink-soft">Cargando...</p>}>
        <Load params={params} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Load({
  params,
  searchParams,
}: Pick<PageProps<"/admin/productos/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  return <Editor id={id} searchParams={searchParams} />;
}
