import type { Metadata } from "next";

import { CategoryCard } from "@/components/marketing/CategoryCard";
import { CtaBanner } from "@/components/marketing/CtaBanner";
import { ProductCard } from "@/components/marketing/ProductCard";
import { Section } from "@/components/marketing/Section";
import { getCategories, getProductsByCategory } from "@/lib/catalog/data";

export const metadata: Metadata = {
  title: "Productos",
  description:
    "Welcome Station, Room Essentials, Business QR Displays y Hospitality Kits: productos personalizados impresos en 3D con código QR.",
  alternates: { canonical: "/productos" },
};

async function CategoryProducts({
  categoryId,
  slug,
}: {
  categoryId: string;
  slug: string;
}) {
  const products = await getProductsByCategory(categoryId);
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} categorySlug={slug} />
      ))}
    </div>
  );
}

async function Catalog() {
  const categories = await getCategories();
  return (
    <>
      <Section
        eyebrow="Catálogo"
        title="Productos que distinguen tu negocio"
        description="Todos se personalizan con tu nombre, logo y colores, e incluyen la opción de QR hacia tu página digital."
        tone="white"
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </Section>
      {categories.map((category, index) => (
        <Section
          key={category.id}
          id={category.slug}
          title={category.name}
          description={category.description ?? undefined}
          tone={index % 2 === 0 ? "cream" : "white"}
        >
          <CategoryProducts categoryId={category.id} slug={category.slug} />
        </Section>
      ))}
    </>
  );
}

export default function ProductsPage() {
  return (
    <>
      <Catalog />
      <CtaBanner />
    </>
  );
}
