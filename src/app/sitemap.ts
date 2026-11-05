import type { MetadataRoute } from "next";

import { getCategories, getProducts } from "@/lib/catalog/data";
import { SITE } from "@/lib/site";

const STATIC_PATHS = [
  "/",
  "/productos",
  "/landing-digital",
  "/como-funciona",
  "/nosotros",
  "/contacto",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);
  const categorySlugById = new Map(categories.map((c) => [c.id, c.slug]));

  const entry = (path: string): MetadataRoute.Sitemap[number] => ({
    url: new URL(path, SITE.url).toString(),
  });

  return [
    ...STATIC_PATHS.map(entry),
    ...categories.map((c) => entry(`/productos/${c.slug}`)),
    ...products.flatMap((p) => {
      const categorySlug = categorySlugById.get(p.category_id);
      return categorySlug
        ? [entry(`/productos/${categorySlug}/${p.slug}`)]
        : [];
    }),
  ];
}
