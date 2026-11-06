"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";

import type { GeneralContent } from "@/lib/templates/general/schema";

import { AddButton, AccentField, Section, TextField } from "./fields";

export function GeneralFields({
  form,
}: {
  form: UseFormReturn<GeneralContent>;
}) {
  const {
    register,
    formState: { errors },
  } = form;
  const links = useFieldArray({
    control: form.control,
    name: "social.links",
  });

  return (
    <div className="space-y-4">
      <AccentField
        value={form.watch("theme.accent")}
        registration={register("theme.accent")}
        error={errors.theme?.accent?.message}
        onPick={(value) =>
          form.setValue("theme.accent", value, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />
      <TextField
        id="tagline"
        label="Lema"
        registration={register("tagline")}
        error={errors.tagline?.message}
      />
      <Section
        title="Botón principal"
        enabled={<input type="checkbox" {...register("cta.enabled")} />}
      >
        <TextField
          id="cta-label"
          label="Texto"
          registration={register("cta.label")}
          error={errors.cta?.label?.message}
        />
        <TextField
          id="cta-url"
          label="Enlace"
          hint="https:// o tel:+506..."
          registration={register("cta.url")}
          error={errors.cta?.url?.message}
        />
      </Section>
      <Section
        title="Descripción"
        enabled={<input type="checkbox" {...register("description.enabled")} />}
      >
        <TextField
          id="description-title"
          label="Título"
          registration={register("description.title")}
          error={errors.description?.title?.message}
        />
        <TextField
          id="description-body"
          label="Texto"
          multiline
          registration={register("description.body")}
          error={errors.description?.body?.message}
        />
      </Section>
      <Section
        title="Ubicación y horario"
        enabled={<input type="checkbox" {...register("location.enabled")} />}
      >
        <TextField
          id="location-address"
          label="Dirección"
          multiline
          registration={register("location.address")}
          error={errors.location?.address?.message}
        />
        <TextField
          id="location-hours"
          label="Horario"
          multiline
          registration={register("location.hours")}
          error={errors.location?.hours?.message}
        />
        <TextField
          id="location-maps"
          label="Enlace de mapa"
          hint="https://"
          registration={register("location.maps_url")}
          error={errors.location?.maps_url?.message}
        />
      </Section>
      <Section
        title="Menú o catálogo"
        enabled={<input type="checkbox" {...register("menu.enabled")} />}
      >
        <TextField
          id="menu-label"
          label="Texto"
          registration={register("menu.label")}
          error={errors.menu?.label?.message}
        />
        <TextField
          id="menu-url"
          label="Enlace"
          hint="https://"
          registration={register("menu.url")}
          error={errors.menu?.url?.message}
        />
      </Section>
      <Section
        title="Reseñas de Google"
        enabled={<input type="checkbox" {...register("reviews.enabled")} />}
      >
        <TextField
          id="reviews-url"
          label="Enlace"
          hint="https://"
          registration={register("reviews.url")}
          error={errors.reviews?.url?.message}
        />
      </Section>
      <Section
        title="Redes"
        enabled={<input type="checkbox" {...register("social.enabled")} />}
      >
        <div className="space-y-3">
          {links.fields.map((_field, index) => (
            <div
              key={index}
              className="border-cream-dark space-y-2 rounded-lg border p-3"
            >
              <TextField
                id={`social-label-${index}`}
                label="Nombre"
                registration={register(`social.links.${index}.label`)}
                error={errors.social?.links?.[index]?.label?.message}
              />
              <TextField
                id={`social-url-${index}`}
                label="Enlace"
                hint="https://"
                registration={register(`social.links.${index}.url`)}
                error={errors.social?.links?.[index]?.url?.message}
              />
              <button
                type="button"
                className="text-sm text-red-700"
                onClick={() => links.remove(index)}
              >
                Quitar
              </button>
            </div>
          ))}
          <AddButton
            disabled={links.fields.length >= 8}
            onClick={() => links.append({ label: "", url: "" })}
          >
            Agregar red
          </AddButton>
        </div>
      </Section>
      <Section
        title="WhatsApp"
        enabled={<input type="checkbox" {...register("whatsapp.enabled")} />}
      >
        <TextField
          id="wa-phone"
          label="Teléfono"
          hint="Ejemplo: 8899 7060"
          registration={register("whatsapp.phone")}
          error={errors.whatsapp?.phone?.message}
        />
        <TextField
          id="wa-label"
          label="Texto del botón"
          registration={register("whatsapp.label")}
          error={errors.whatsapp?.label?.message}
        />
        <TextField
          id="wa-message"
          label="Mensaje"
          multiline
          registration={register("whatsapp.message")}
          error={errors.whatsapp?.message?.message}
        />
      </Section>
    </div>
  );
}
