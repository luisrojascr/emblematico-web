"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";

import type { HospitalityContent } from "@/lib/templates/hospitality/schema";

import { AddButton, AccentField, Section, TextField } from "./fields";

export function HospitalityFields({
  form,
}: {
  form: UseFormReturn<HospitalityContent>;
}) {
  const {
    register,
    formState: { errors },
  } = form;
  const amenities = useFieldArray({
    control: form.control,
    name: "amenities.items",
  });
  const recommendations = useFieldArray({
    control: form.control,
    name: "recommendations.items",
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
        title="Bienvenida"
        enabled={<input type="checkbox" {...register("welcome.enabled")} />}
      >
        <TextField
          id="welcome-title"
          label="Título"
          registration={register("welcome.title")}
          error={errors.welcome?.title?.message}
        />
        <TextField
          id="welcome-message"
          label="Mensaje"
          multiline
          registration={register("welcome.message")}
          error={errors.welcome?.message?.message}
        />
      </Section>
      <Section
        title="Wi-Fi"
        enabled={<input type="checkbox" {...register("wifi.enabled")} />}
      >
        <TextField
          id="wifi-network"
          label="Red"
          registration={register("wifi.network")}
          error={errors.wifi?.network?.message}
        />
        <TextField
          id="wifi-password"
          label="Contraseña"
          registration={register("wifi.password")}
          error={errors.wifi?.password?.message}
        />
        <TextField
          id="wifi-notes"
          label="Notas"
          registration={register("wifi.notes")}
          error={errors.wifi?.notes?.message}
        />
      </Section>
      <Section
        title="Llegada y salida"
        enabled={<input type="checkbox" {...register("stay.enabled")} />}
      >
        <TextField
          id="stay-in"
          label="Check-in"
          registration={register("stay.check_in")}
          error={errors.stay?.check_in?.message}
        />
        <TextField
          id="stay-out"
          label="Check-out"
          registration={register("stay.check_out")}
          error={errors.stay?.check_out?.message}
        />
        <TextField
          id="stay-notes"
          label="Indicaciones"
          multiline
          registration={register("stay.notes")}
          error={errors.stay?.notes?.message}
        />
      </Section>
      <Section
        title="Reglas de la casa"
        enabled={<input type="checkbox" {...register("rules.enabled")} />}
      >
        <RuleList
          items={form.watch("rules.items")}
          error={firstMessage(errors.rules?.items)}
          onChange={(items) =>
            form.setValue("rules.items", items, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      </Section>
      <Section
        title="Servicios"
        enabled={<input type="checkbox" {...register("amenities.enabled")} />}
      >
        <div className="space-y-3">
          {amenities.fields.map((_field, index) => (
            <div
              key={index}
              className="border-cream-dark space-y-2 rounded-lg border p-3"
            >
              <TextField
                id={`amenity-label-${index}`}
                label="Nombre"
                registration={register(`amenities.items.${index}.label`)}
                error={errors.amenities?.items?.[index]?.label?.message}
              />
              <TextField
                id={`amenity-detail-${index}`}
                label="Detalle"
                registration={register(`amenities.items.${index}.detail`)}
                error={errors.amenities?.items?.[index]?.detail?.message}
              />
              <button
                type="button"
                className="text-sm text-red-700"
                onClick={() => amenities.remove(index)}
              >
                Quitar
              </button>
            </div>
          ))}
          <AddButton
            disabled={amenities.fields.length >= 20}
            onClick={() => amenities.append({ label: "", detail: "" })}
          >
            Agregar servicio
          </AddButton>
        </div>
      </Section>
      <Section
        title="Recomendaciones"
        enabled={
          <input type="checkbox" {...register("recommendations.enabled")} />
        }
      >
        <div className="space-y-3">
          {recommendations.fields.map((_field, index) => (
            <div
              key={index}
              className="border-cream-dark space-y-2 rounded-lg border p-3"
            >
              <TextField
                id={`rec-name-${index}`}
                label="Nombre"
                registration={register(`recommendations.items.${index}.name`)}
                error={errors.recommendations?.items?.[index]?.name?.message}
              />
              <TextField
                id={`rec-category-${index}`}
                label="Tipo"
                registration={register(
                  `recommendations.items.${index}.category`,
                )}
                error={
                  errors.recommendations?.items?.[index]?.category?.message
                }
              />
              <TextField
                id={`rec-description-${index}`}
                label="Descripción"
                multiline
                registration={register(
                  `recommendations.items.${index}.description`,
                )}
                error={
                  errors.recommendations?.items?.[index]?.description?.message
                }
              />
              <TextField
                id={`rec-url-${index}`}
                label="Enlace"
                hint="https://"
                registration={register(`recommendations.items.${index}.url`)}
                error={errors.recommendations?.items?.[index]?.url?.message}
              />
              <button
                type="button"
                className="text-sm text-red-700"
                onClick={() => recommendations.remove(index)}
              >
                Quitar
              </button>
            </div>
          ))}
          <AddButton
            disabled={recommendations.fields.length >= 12}
            onClick={() =>
              recommendations.append({
                name: "",
                category: "",
                description: "",
                url: "",
              })
            }
          >
            Agregar recomendación
          </AddButton>
        </div>
      </Section>
      <WhatsappFields form={form} />
    </div>
  );
}

function RuleList({
  items,
  error,
  onChange,
}: {
  items: string[];
  error?: string;
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            aria-label={`Regla ${index + 1}`}
            className="border-cream-dark w-full rounded-lg border bg-white px-3 py-2"
            value={item}
            onChange={(event) => {
              const next = [...items];
              next[index] = event.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            className="text-sm text-red-700"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Quitar
          </button>
        </div>
      ))}
      <AddButton
        disabled={items.length >= 15}
        onClick={() => onChange([...items, ""])}
      >
        Agregar regla
      </AddButton>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

function WhatsappFields({ form }: { form: UseFormReturn<HospitalityContent> }) {
  const {
    register,
    formState: { errors },
  } = form;
  return (
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
  );
}

function firstMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (Array.isArray(error)) {
    for (const item of error) {
      const message = firstMessage(item);
      if (message) return message;
    }
  }
  return undefined;
}
