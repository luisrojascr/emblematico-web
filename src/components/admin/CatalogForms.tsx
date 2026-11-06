"use client";

import { useActionState } from "react";

import {
  saveCategory,
  saveProduct,
} from "@/app/(site)/admin/productos/actions";
import { idleState } from "@/lib/admin/schemas";
import { mediaUrl } from "@/lib/catalog/media";

import { SubmitButton } from "./SubmitButton";
import { FieldError, inputClass } from "./ui";

type CategoryFields = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  imagePath?: string | null;
};

export function CategoryForm({ category }: { category?: CategoryFields }) {
  const [state, action] = useActionState(saveCategory, idleState);
  const errors = state.fieldErrors ?? {};
  const key = category?.id ?? "new";

  return (
    <form action={action} className="space-y-3">
      {category?.id && <input type="hidden" name="id" value={category.id} />}
      {state.message && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
      <div className="space-y-1">
        <label htmlFor={`cat-name-${key}`} className="text-sm font-medium">
          Nombre
        </label>
        <input
          id={`cat-name-${key}`}
          name="name"
          required
          defaultValue={category?.name ?? ""}
          className={inputClass}
        />
        <FieldError id={`cat-name-error-${key}`} message={errors.name} />
      </div>
      <div className="space-y-1">
        <label htmlFor={`cat-slug-${key}`} className="text-sm font-medium">
          Slug
        </label>
        <input
          id={`cat-slug-${key}`}
          name="slug"
          defaultValue={category?.slug ?? ""}
          className={inputClass}
        />
        <FieldError id={`cat-slug-error-${key}`} message={errors.slug} />
      </div>
      <div className="space-y-1">
        <label
          htmlFor={`cat-description-${key}`}
          className="text-sm font-medium"
        >
          Descripción
        </label>
        <textarea
          id={`cat-description-${key}`}
          name="description"
          rows={3}
          defaultValue={category?.description ?? ""}
          className={inputClass}
        />
        <FieldError
          id={`cat-description-error-${key}`}
          message={errors.description}
        />
      </div>
      {category?.imagePath && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(category.imagePath)}
          alt=""
          className="h-16 w-16 rounded object-cover"
        />
      )}
      <div className="space-y-1">
        <label htmlFor={`cat-image-${key}`} className="text-sm font-medium">
          Imagen
        </label>
        <input
          id={`cat-image-${key}`}
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm"
        />
        <FieldError id={`cat-image-error-${key}`} message={errors.image} />
      </div>
      {category?.imagePath && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="removeImage" />
          Quitar imagen
        </label>
      )}
      <SubmitButton>
        {category?.id ? "Guardar categoría" : "Crear categoría"}
      </SubmitButton>
    </form>
  );
}

type ProductFields = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  isActive: boolean;
  imagePath: string | null;
};

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductFields;
  categories: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(saveProduct, idleState);
  const errors = state.fieldErrors ?? {};
  const editing = Boolean(product);

  return (
    <form action={action} className="space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      {state.message && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
      <div className="space-y-1">
        <label htmlFor="product-name" className="text-sm font-medium">
          Nombre
        </label>
        <input
          id="product-name"
          name="name"
          required
          defaultValue={product?.name ?? ""}
          className={inputClass}
        />
        <FieldError id="product-name-error" message={errors.name} />
      </div>
      <div className="space-y-1">
        <label htmlFor="product-slug" className="text-sm font-medium">
          Slug
        </label>
        <input
          id="product-slug"
          name="slug"
          defaultValue={product?.slug ?? ""}
          className={inputClass}
        />
        <p className="text-ink-soft text-sm">
          Si lo cambias, el enlace público anterior deja de funcionar.
        </p>
        <FieldError id="product-slug-error" message={errors.slug} />
      </div>
      <div className="space-y-1">
        <label htmlFor="categoryId" className="text-sm font-medium">
          Categoría
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={product?.categoryId ?? categories[0]?.id ?? ""}
          className={inputClass}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <FieldError id="category-error" message={errors.categoryId} />
      </div>
      {editing && (
        <>
          <div className="space-y-1">
            <label htmlFor="summary" className="text-sm font-medium">
              Resumen
            </label>
            <input
              id="summary"
              name="summary"
              defaultValue={product?.summary ?? ""}
              className={inputClass}
            />
            <FieldError id="summary-error" message={errors.summary} />
          </div>
          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              defaultValue={product?.description ?? ""}
              className={inputClass}
            />
            <FieldError id="description-error" message={errors.description} />
          </div>
          {product?.imagePath && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(product.imagePath)}
              alt=""
              className="h-24 w-24 rounded object-cover"
            />
          )}
          <div className="space-y-1">
            <label htmlFor="product-image" className="text-sm font-medium">
              Imagen
            </label>
            <input
              id="product-image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="text-sm"
            />
            <FieldError id="product-image-error" message={errors.image} />
          </div>
          {product?.imagePath && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="removeImage" />
              Quitar imagen
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product?.isActive ?? true}
            />
            Visible en el catálogo
          </label>
        </>
      )}
      <SubmitButton>
        {editing ? "Guardar producto" : "Crear producto"}
      </SubmitButton>
    </form>
  );
}
