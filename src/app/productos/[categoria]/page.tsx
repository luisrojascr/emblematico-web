import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CtaBanner } from "@/components/marketing/CtaBanner";
import { ProductCard } from "@/components/marketing/ProductCard";
import { Section } from "@/components/marketing/Section";
import {
  getCategories,
  getCategoryBySlug,
  getProductsByCategory,
} from "@/lib/catalog/data";
import { mediaUrl } from "@/lib/catalog/media";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/productos/[categoria]">): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description ?? undefined,
    alternates: { canonical: `/productos/${category.slug}` },
    openGraph: category.image_path
      ? { images: [mediaUrl(category.image_path)] }
      : undefined,
  };
}

export default async function CategoryPage({
  params,
}: PageProps<"/productos/[categoria]">) {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  if (!category) notFound();

  const products = await getProductsByCategory(category.id);

  return (
    <>
      <Section
        eyebrow="Categoría"
        title={category.name}
        description={category.description ?? undefined}
        tone="white"
      >
        {products.length === 0 ? (
          <p className="text-ink-soft">
            Pronto agregaremos productos a esta categoría.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categorySlug={category.slug}
              />
            ))}
          </div>
        )}
      </Section>
      <CtaBanner
        title={`Cotiza ${category.name}`}
        whatsappMessage={`Hola, me gustaría cotizar ${category.name} de emblemático.`}
      />
    </>
  );
}
