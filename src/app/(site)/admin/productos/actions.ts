"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { isStoredCatalogImage } from "@/lib/admin/images";
import { moveItem } from "@/lib/admin/order";
import {
  categorySchema,
  checked,
  postgresMessage,
  productSchema,
  reorderSchema,
  zodFieldErrors,
  type ActionState,
} from "@/lib/admin/schemas";
import { slugError, uniqueSlug, type SlugRules } from "@/lib/admin/slug";
import { assertAdmin } from "@/lib/admin/guard";
import { uploadCatalogFile } from "@/lib/admin/storage";
import { CATALOG_TAG } from "@/lib/catalog/data";

const CATALOG_SLUG: SlugRules = { reserved: [], minLength: 3, maxLength: 80 };

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function fail(
  message: string,
  fieldErrors?: Record<string, string>,
): ActionState {
  return { status: "error", message, fieldErrors };
}

function refreshCatalog() {
  revalidateTag(CATALOG_TAG, { expire: 0 });
  revalidatePath("/admin/productos");
  revalidatePath("/productos");
}

export async function saveCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const id = text(formData, "id");
  const parsed = categorySchema.safeParse({
    id: id || undefined,
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    description: text(formData, "description"),
    removeImage: checked(formData, "removeImage"),
  });
  if (!parsed.success) {
    return fail(
      "Revisa los campos marcados.",
      zodFieldErrors(parsed.error, ["name", "slug", "description"]),
    );
  }

  const { data: existing } = await supabase
    .from("product_categories")
    .select("id, slug");
  const taken = new Set(
    (existing ?? [])
      .filter((row) => row.id !== parsed.data.id)
      .map((row) => row.slug),
  );
  const slug =
    parsed.data.slug || uniqueSlug(parsed.data.name, taken, CATALOG_SLUG);
  if (!slug || slugError(slug, CATALOG_SLUG)) {
    return fail("El slug no es válido.", {
      slug: "Usa minúsculas, números y guiones.",
    });
  }
  if (taken.has(slug))
    return fail("Ese slug ya existe.", { slug: "Elige otro slug." });

  let imagePath: string | null | undefined;
  if (parsed.data.id) {
    const { data: current } = await supabase
      .from("product_categories")
      .select("image_path")
      .eq("id", parsed.data.id)
      .maybeSingle();
    imagePath =
      current?.image_path && isStoredCatalogImage(current.image_path)
        ? current.image_path
        : null;
    if (parsed.data.removeImage) imagePath = null;
  }

  const uploaded = await uploadCatalogFile(supabase, formData.get("image"));
  if (uploaded && "error" in uploaded)
    return fail(uploaded.error, { image: uploaded.error });
  if (uploaded && "path" in uploaded) imagePath = uploaded.path;

  const row = {
    name: parsed.data.name,
    slug,
    description: parsed.data.description || null,
    ...(imagePath !== undefined ? { image_path: imagePath } : {}),
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("product_categories")
      .update(row)
      .eq("id", parsed.data.id);
    if (error) {
      console.error("update category failed", error.code, error.message);
      return fail(postgresMessage(error));
    }
  } else {
    const sortOrder = (existing?.length ?? 0) + 1;
    const { error } = await supabase
      .from("product_categories")
      .insert({ ...row, sort_order: sortOrder });
    if (error) {
      console.error("insert category failed", error.code, error.message);
      return fail(postgresMessage(error));
    }
  }

  refreshCatalog();
  redirect("/admin/productos?aviso=guardado");
}

export async function saveProduct(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const id = text(formData, "id");
  const parsed = productSchema.safeParse({
    id: id || undefined,
    categoryId: text(formData, "categoryId"),
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    summary: text(formData, "summary"),
    description: text(formData, "description"),
    isActive: id ? checked(formData, "isActive") : true,
    removeImage: checked(formData, "removeImage"),
  });
  if (!parsed.success) {
    return fail(
      "Revisa los campos marcados.",
      zodFieldErrors(parsed.error, [
        "name",
        "slug",
        "summary",
        "description",
        "categoryId",
      ]),
    );
  }

  const { data: existing } = await supabase
    .from("products")
    .select("id, slug, category_id, sort_order");
  const taken = new Set(
    (existing ?? [])
      .filter((row) => row.id !== parsed.data.id)
      .map((row) => row.slug),
  );
  const slug =
    parsed.data.slug || uniqueSlug(parsed.data.name, taken, CATALOG_SLUG);
  if (!slug || slugError(slug, CATALOG_SLUG)) {
    return fail("El slug no es válido.", {
      slug: "Usa minúsculas, números y guiones.",
    });
  }
  if (taken.has(slug))
    return fail("Ese slug ya existe.", { slug: "Elige otro slug." });

  let images: string[] | undefined;
  if (parsed.data.id) {
    const { data: current } = await supabase
      .from("products")
      .select("images")
      .eq("id", parsed.data.id)
      .maybeSingle();
    images = (current?.images ?? []).filter(isStoredCatalogImage);
    if (parsed.data.removeImage) images = [];
  }

  const uploaded = await uploadCatalogFile(supabase, formData.get("image"));
  if (uploaded && "error" in uploaded)
    return fail(uploaded.error, { image: uploaded.error });
  if (uploaded && "path" in uploaded) images = [uploaded.path];

  const row = {
    category_id: parsed.data.categoryId,
    name: parsed.data.name,
    slug,
    summary: parsed.data.summary || null,
    description: parsed.data.description || null,
    is_active: parsed.data.isActive,
    ...(images !== undefined ? { images } : {}),
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("products")
      .update(row)
      .eq("id", parsed.data.id);
    if (error) {
      console.error("update product failed", error.code, error.message);
      return fail(postgresMessage(error));
    }
    refreshCatalog();
    revalidatePath(`/admin/productos/${parsed.data.id}`);
    redirect(`/admin/productos/${parsed.data.id}?aviso=guardado`);
  }

  const siblings = (existing ?? []).filter(
    (row) => row.category_id === parsed.data.categoryId,
  );
  const sortOrder =
    siblings.reduce((max, row) => Math.max(max, row.sort_order), 0) + 1;
  const { data, error } = await supabase
    .from("products")
    .insert({ ...row, images: images ?? [], sort_order: sortOrder })
    .select("id")
    .single();
  if (error || !data) {
    console.error("insert product failed", error?.code, error?.message);
    return fail(
      error ? postgresMessage(error) : "No pudimos crear el producto.",
    );
  }
  refreshCatalog();
  redirect(`/admin/productos/${data.id}?aviso=creado`);
}

async function persistOrder(
  table: "products" | "product_categories",
  ordered: { id: string }[],
) {
  const { supabase } = await assertAdmin();
  for (const [index, item] of ordered.entries()) {
    const { error } =
      table === "products"
        ? await supabase
            .from("products")
            .update({ sort_order: index })
            .eq("id", item.id)
        : await supabase
            .from("product_categories")
            .update({ sort_order: index })
            .eq("id", item.id);
    if (error) {
      console.error("reorder failed", error.code, error.message);
      redirect("/admin/productos?aviso=error");
    }
  }
  refreshCatalog();
  redirect("/admin/productos?aviso=orden");
}

export async function reorderCategory(formData: FormData): Promise<void> {
  const parsed = reorderSchema.safeParse({
    id: text(formData, "id"),
    direction: text(formData, "direction"),
  });
  if (!parsed.success) redirect("/admin/productos?aviso=error");
  const { supabase } = await assertAdmin();
  const { data } = await supabase
    .from("product_categories")
    .select("id")
    .order("sort_order")
    .order("name");
  const next = moveItem(data ?? [], parsed.data.id, parsed.data.direction);
  if (!next) redirect("/admin/productos?aviso=error");
  await persistOrder("product_categories", next);
}

export async function reorderProduct(formData: FormData): Promise<void> {
  const parsed = reorderSchema.safeParse({
    id: text(formData, "id"),
    direction: text(formData, "direction"),
  });
  if (!parsed.success) redirect("/admin/productos?aviso=error");
  const { supabase } = await assertAdmin();
  const { data: product } = await supabase
    .from("products")
    .select("id, category_id")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!product) redirect("/admin/productos?aviso=error");
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("category_id", product.category_id)
    .order("sort_order")
    .order("name");
  const next = moveItem(data ?? [], parsed.data.id, parsed.data.direction);
  if (!next) redirect("/admin/productos?aviso=error");
  await persistOrder("products", next);
}
