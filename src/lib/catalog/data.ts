import { cacheLife, cacheTag } from "next/cache";

import type { Database } from "@/lib/supabase/database.types";
import { createPublicClient } from "@/lib/supabase/public";

export type Category =
  Database["public"]["Tables"]["product_categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];

export const CATALOG_TAG = "catalog";

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("product_categories")
    .select("*")
    .order("sort_order");
  if (error)
    throw new Error(`catalog: categories query failed: ${error.message}`);
  return data;
}

/** Active products only (RLS also hides inactive ones from anon). */
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (error)
    throw new Error(`catalog: products query failed: ${error.message}`);
  return data;
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getProductsByCategory(
  categoryId: string,
): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.category_id === categoryId);
}

export async function getProductBySlugs(
  categorySlug: string,
  productSlug: string,
): Promise<{ category: Category; product: Product } | null> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return null;
  const products = await getProductsByCategory(category.id);
  const product = products.find((p) => p.slug === productSlug);
  return product ? { category, product } : null;
}
