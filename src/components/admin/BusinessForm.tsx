"use client";

import { useActionState, useState } from "react";

import {
  createBusiness,
  updateBusiness,
} from "@/app/(site)/admin/negocios/actions";
import { TEMPLATE_OPTIONS } from "@/lib/admin/labels";
import { idleState, isoToLocalInput } from "@/lib/admin/schemas";
import { slugifyName } from "@/lib/admin/slug";

import { SubmitButton } from "./SubmitButton";
import { FieldError, inputClass } from "./ui";

type EditBusiness = {
  id: string;
  name: string;
  slug: string;
  category: string;
  template: "hospitality" | "general";
  servicePlan: string;
  serviceExpiresAt: string | null;
  indexable: boolean;
};

export function BusinessForm({ business }: { business?: EditBusiness }) {
  const editing = Boolean(business);
  const action = editing ? updateBusiness : createBusiness;
  const [state, formAction] = useActionState(action, idleState);
  const [name, setName] = useState(business?.name ?? "");
  const [slug, setSlug] = useState(business?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {business && (
        <input type="hidden" name="businessId" value={business.id} />
      )}
      {state.message && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(event) => {
            const next = event.target.value;
            setName(next);
            if (!slugTouched) setSlug(slugifyName(next));
          }}
          className={inputClass}
        />
        <FieldError id="name-error" message={errors.name} />
      </div>

      <div className="space-y-1">
        <label htmlFor="slug" className="text-sm font-medium">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
          className={inputClass}
          aria-describedby="slug-help"
        />
        <p id="slug-help" className="text-ink-soft text-sm">
          {editing
            ? "Si lo cambias, el slug anterior redirige a la nueva dirección. Los QR ya impresos siguen abriendo la página."
            : "Se arma a partir del nombre. Puedes ajustarlo antes de crear el negocio."}
        </p>
        <FieldError id="slug-error" message={errors.slug} />
      </div>

      {editing && (
        <div className="space-y-1">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="confirmSlug" className="mt-1" />
            <span>
              Confirmo el cambio de slug y entiendo que el anterior va a
              redirigir.
            </span>
          </label>
          <FieldError id="confirm-slug-error" message={errors.confirmSlug} />
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="category" className="text-sm font-medium">
          Categoría
        </label>
        <input
          id="category"
          name="category"
          defaultValue={business?.category ?? ""}
          maxLength={60}
          className={inputClass}
        />
        <FieldError id="category-error" message={errors.category} />
      </div>

      <div className="space-y-1">
        <label htmlFor="template" className="text-sm font-medium">
          Plantilla
        </label>
        <select
          id="template"
          name="template"
          defaultValue={business?.template ?? "hospitality"}
          className={inputClass}
        >
          {TEMPLATE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError id="template-error" message={errors.template} />
      </div>

      {editing && (
        <div className="space-y-1">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="confirmTemplate" className="mt-1" />
            <span>
              Confirmo el cambio de plantilla. Eso borra el contenido y
              despublica la página.
            </span>
          </label>
          <FieldError
            id="confirm-template-error"
            message={errors.confirmTemplate}
          />
        </div>
      )}

      {editing && business && (
        <>
          <div className="space-y-1">
            <label htmlFor="servicePlan" className="text-sm font-medium">
              Plan de servicio
            </label>
            <input
              id="servicePlan"
              name="servicePlan"
              defaultValue={business.servicePlan}
              maxLength={60}
              className={inputClass}
            />
            <FieldError id="plan-error" message={errors.servicePlan} />
          </div>
          <div className="space-y-1">
            <label htmlFor="serviceExpiresAt" className="text-sm font-medium">
              Vence
            </label>
            <input
              id="serviceExpiresAt"
              name="serviceExpiresAt"
              type="datetime-local"
              defaultValue={isoToLocalInput(business.serviceExpiresAt)}
              className={inputClass}
            />
            <p className="text-ink-soft text-sm">
              La fecha es informativa. La página no se suspende sola: usa el
              botón de suspender.
            </p>
            <FieldError id="expiry-error" message={errors.serviceExpiresAt} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="indexable"
              defaultChecked={business.indexable}
            />
            Permitir que los buscadores indexen la página pública
          </label>
        </>
      )}

      <SubmitButton>
        {editing ? "Guardar negocio" : "Crear negocio"}
      </SubmitButton>
    </form>
  );
}
