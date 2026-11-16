"use client";

import { useState, type ReactNode } from "react";
import {
  useFieldArray,
  useWatch,
  type UseFormReturn,
} from "react-hook-form";

import type { HospitalityContent } from "@/lib/templates/hospitality/schema";
import { displayTime, toTime24 } from "@/lib/templates/time";

import { AddButton, AccentField, TextField } from "./fields";

type Form = UseFormReturn<HospitalityContent>;
type SectionKey =
  | "welcome"
  | "wifi"
  | "whatsapp"
  | "stay"
  | "rules"
  | "amenities"
  | "recommendations";

const icon = (path: ReactNode) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {path}
  </svg>
);

const SECTIONS: Record<
  SectionKey,
  { title: string; help: string; icon: ReactNode }
> = {
  welcome: {
    title: "Bienvenida",
    help: "Lo primero que leen al abrir la guía.",
    icon: icon(<path d="M4 6h16v10H8l-4 4z" />),
  },
  wifi: {
    title: "Wi‑Fi",
    help: "Casi siempre es lo primero que buscan.",
    icon: icon(
      <>
        <path d="M2 9a15 15 0 0 1 20 0" />
        <path d="M5.5 12.5a10 10 0 0 1 13 0" />
        <path d="M9 16a5 5 0 0 1 6 0" />
        <circle cx="12" cy="19.5" r="0.8" />
      </>,
    ),
  },
  whatsapp: {
    title: "Contacto",
    help: "Un botón de WhatsApp para cuando algo no va bien.",
    icon: icon(
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>,
    ),
  },
  stay: {
    title: "Llegada y salida",
    help: "Los horarios y lo que deben hacer antes de irse.",
    icon: icon(
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>,
    ),
  },
  rules: {
    title: "Reglas de la casa",
    help: "Lo que se vale y lo que no.",
    icon: icon(
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>,
    ),
  },
  amenities: {
    title: "Servicios del lugar",
    help: "Piscina, parqueo, aire acondicionado…",
    icon: icon(<path d="M12 3l2.6 5.6 6 .6-4.5 4 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.5-4 6-.6z" />),
  },
  recommendations: {
    title: "Recomendaciones",
    help: "Restaurantes, playas y lugares que te gustan.",
    icon: icon(
      <>
        <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </>,
    ),
  },
};

/** Mismo orden que la guía (HospitalityTemplate): así coincide con la vista previa. */
const ORDER: readonly SectionKey[] = [
  "whatsapp",
  "welcome",
  "wifi",
  "stay",
  "rules",
  "amenities",
  "recommendations",
];

function truncate(value: string, max = 70): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/** Resumen de una línea y si la sección tiene lo mínimo para mostrarse. */
function status(key: SectionKey, c: HospitalityContent): { ready: boolean; summary: string } {
  switch (key) {
    case "welcome":
      return { ready: Boolean(c.welcome.message.trim()), summary: truncate(c.welcome.message) };
    case "wifi":
      return {
        ready: Boolean(c.wifi.network || c.wifi.password),
        summary: [c.wifi.network, c.wifi.password && "contraseña agregada"]
          .filter(Boolean)
          .join(" · "),
      };
    case "whatsapp":
      return { ready: Boolean(c.whatsapp.phone), summary: c.whatsapp.phone ? `WhatsApp ${c.whatsapp.phone}` : "" };
    case "stay":
      return {
        ready: Boolean(c.stay.check_in || c.stay.check_out || c.stay.notes),
        summary: [c.stay.check_in && `Llegada ${displayTime(c.stay.check_in)}`, c.stay.check_out && `Salida ${displayTime(c.stay.check_out)}`]
          .filter(Boolean)
          .join(" · ") || truncate(c.stay.notes),
      };
    case "rules": {
      const items = c.rules.items.filter((r) => r.trim());
      return { ready: items.length > 0, summary: truncate(items.join(" · ")) };
    }
    case "amenities": {
      const items = c.amenities.items.filter((a) => a.label.trim());
      return {
        ready: items.length > 0,
        summary: truncate(items.map((a) => a.label).join(" · ")),
      };
    }
    case "recommendations": {
      const items = c.recommendations.items.filter((r) => r.name.trim());
      return {
        ready: items.length > 0,
        summary: items.length
          ? truncate(`${items.length} ${items.length === 1 ? "lugar" : "lugares"} · ${items.map((r) => r.name).join(", ")}`)
          : "",
      };
    }
  }
}

function SectionCard({
  sectionKey,
  ready,
  summary,
  open,
  onOpen,
  onHide,
  onCancel,
  children,
}: {
  onCancel: () => void;
  sectionKey: SectionKey;
  ready: boolean;
  summary: string;
  open: boolean;
  onOpen: () => void;
  onHide: () => void;
  children: ReactNode;
}) {
  const info = SECTIONS[sectionKey];
  return (
    <li
      className={`rounded-2xl border-2 bg-white transition-colors ${
        ready ? "border-teal/60" : "border-sand/70"
      }`}
    >
      <div className="flex items-center gap-3 p-3 sm:p-4">
        <span
          aria-hidden="true"
          className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
            ready ? "bg-teal text-white" : "bg-sand/30 text-ink"
          }`}
        >
          {ready ? (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <span className="text-xs font-bold">!</span>
          )}
        </span>
        <span className="bg-cream text-teal-deep hidden size-10 shrink-0 items-center justify-center rounded-xl sm:flex">
          {info.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 font-semibold">
            {info.title}
            <span
              className={`text-xs font-bold ${ready ? "text-teal-deep" : "text-ink-soft"}`}
            >
              {ready ? "Lista" : "Falta completar"}
            </span>
          </p>
          <p className="text-ink-soft truncate text-sm">
            {summary || info.help}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={onOpen}
          className="text-teal-deep shrink-0 rounded-lg px-2 py-1 text-sm font-semibold hover:bg-cream"
        >
          {open ? "Cerrar" : "Editar"}
        </button>
      </div>
      {open ? (
        <div className="border-cream-dark space-y-3 border-t px-4 pt-4 pb-5 sm:pl-[4.75rem]">
          {children}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onHide}
              className="text-ink-soft hover:text-ink text-sm underline"
            >
              Quitar de la guía
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="text-ink-soft hover:text-ink rounded-full px-4 py-2 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onOpen}
                className="bg-sand text-ink hover:bg-sand-hover rounded-full px-5 py-2 text-sm font-semibold"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function HospitalityFields({ form }: { form: Form }) {
  const {
    register,
    formState: { errors },
  } = form;
  const content = useWatch({ control: form.control }) as HospitalityContent;
  const [open, setOpen] = useState<SectionKey | null>(null);
  // Copia de la sección al abrirla, para que "Cancelar" deshaga los cambios.
  const [snapshot, setSnapshot] = useState<unknown>(null);
  const openSection = (key: SectionKey | null) => {
    setSnapshot(key ? structuredClone(form.getValues(key)) : null);
    setOpen(key);
  };
  const amenities = useFieldArray({ control: form.control, name: "amenities.items" });
  const recommendations = useFieldArray({
    control: form.control,
    name: "recommendations.items",
  });

  const setEnabled = (key: SectionKey, value: boolean) =>
    form.setValue(`${key}.enabled`, value, { shouldDirty: true });

  const shown = ORDER.filter((key) => content[key]?.enabled);
  const available = ORDER.filter((key) => !content[key]?.enabled);
  const readyCount = shown.filter((key) => status(key, content).ready).length;

  const body: Record<SectionKey, ReactNode> = {
    welcome: (
      <>
        <TextField id="welcome-title" label="Título" registration={register("welcome.title")} error={errors.welcome?.title?.message} />
        <TextField id="welcome-message" label="Mensaje" multiline registration={register("welcome.message")} error={errors.welcome?.message?.message} />
      </>
    ),
    wifi: (
      <>
        <TextField id="wifi-network" label="Nombre de la red" registration={register("wifi.network")} error={errors.wifi?.network?.message} />
        <TextField id="wifi-password" label="Contraseña" hint="Se muestra a tus huéspedes. Déjala vacía si la red es abierta." registration={register("wifi.password")} error={errors.wifi?.password?.message} />
        <TextField id="wifi-notes" label="Notas" registration={register("wifi.notes")} error={errors.wifi?.notes?.message} />
      </>
    ),
    whatsapp: (
      <>
        <TextField id="wa-phone" label="WhatsApp" hint="Ejemplo: 8899 7060" registration={register("whatsapp.phone")} error={errors.whatsapp?.phone?.message} />
        <TextField id="wa-label" label="Texto del botón" registration={register("whatsapp.label")} error={errors.whatsapp?.label?.message} />
        <TextField id="wa-message" label="Mensaje inicial" multiline registration={register("whatsapp.message")} error={errors.whatsapp?.message?.message} />
      </>
    ),
    stay: (
      <StayFields
        checkIn={content.stay?.check_in ?? ""}
        checkOut={content.stay?.check_out ?? ""}
        notes={content.stay?.notes ?? ""}
        notesField={
          <TextField id="stay-notes" label="Indicaciones" hint="Dónde están las llaves, qué hacer antes de irse…" multiline registration={register("stay.notes")} error={errors.stay?.notes?.message} />
        }
        onTime={(field, value) =>
          form.setValue(`stay.${field}`, value, { shouldDirty: true, shouldValidate: true })
        }
      />
    ),
    rules: (
      <RuleList
        items={content.rules?.items ?? []}
        error={firstMessage(errors.rules?.items)}
        onChange={(items) =>
          form.setValue("rules.items", items, { shouldDirty: true, shouldValidate: true })
        }
      />
    ),
    amenities: (
      <div className="space-y-3">
        {amenities.fields.map((field, index) => (
          <div key={field.id} className="border-cream-dark space-y-2 rounded-xl border p-3">
            <TextField id={`amenity-label-${index}`} label="Nombre" registration={register(`amenities.items.${index}.label`)} error={errors.amenities?.items?.[index]?.label?.message} />
            <TextField id={`amenity-detail-${index}`} label="Detalle" registration={register(`amenities.items.${index}.detail`)} error={errors.amenities?.items?.[index]?.detail?.message} />
            <button type="button" className="text-sm text-red-700" onClick={() => amenities.remove(index)}>
              Quitar
            </button>
          </div>
        ))}
        <AddButton disabled={amenities.fields.length >= 20} onClick={() => amenities.append({ label: "", detail: "" })}>
          Agregar servicio
        </AddButton>
      </div>
    ),
    recommendations: (
      <div className="space-y-3">
        {recommendations.fields.map((field, index) => (
          <div key={field.id} className="border-cream-dark space-y-2 rounded-xl border p-3">
            <TextField id={`rec-name-${index}`} label="Nombre" registration={register(`recommendations.items.${index}.name`)} error={errors.recommendations?.items?.[index]?.name?.message} />
            <TextField id={`rec-category-${index}`} label="Tipo" hint="Restaurante, playa, tour…" registration={register(`recommendations.items.${index}.category`)} error={errors.recommendations?.items?.[index]?.category?.message} />
            <TextField id={`rec-description-${index}`} label="Descripción" multiline registration={register(`recommendations.items.${index}.description`)} error={errors.recommendations?.items?.[index]?.description?.message} />
            <TextField id={`rec-url-${index}`} label="Enlace" hint="https://" registration={register(`recommendations.items.${index}.url`)} error={errors.recommendations?.items?.[index]?.url?.message} />
            <button type="button" className="text-sm text-red-700" onClick={() => recommendations.remove(index)}>
              Quitar
            </button>
          </div>
        ))}
        <AddButton
          disabled={recommendations.fields.length >= 12}
          onClick={() => recommendations.append({ name: "", category: "", description: "", url: "" })}
        >
          Agregar recomendación
        </AddButton>
      </div>
    ),
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl">Información para tus huéspedes</h2>
          {shown.length ? (
            <p className="text-ink-soft text-sm">
              {readyCount} de {shown.length} listas
            </p>
          ) : null}
        </div>
        <div className="bg-cream/70 rounded-3xl p-3 sm:p-4">
          <p className="text-ink-soft mb-3 px-1 text-xs font-bold tracking-wider">
            EN TU GUÍA <span className="font-normal tracking-normal">· en el orden en que la ven</span>
          </p>
          {shown.length ? (
            <ul className="space-y-2">
              {shown.map((key) => {
                const s = status(key, content);
                return (
                  <SectionCard
                    key={key}
                    sectionKey={key}
                    ready={s.ready}
                    summary={s.summary}
                    open={open === key}
                    onOpen={() => openSection(open === key ? null : key)}
                    onHide={() => {
                      setEnabled(key, false);
                      openSection(null);
                    }}
                    onCancel={() => {
                      if (snapshot) {
                        form.setValue(key, snapshot as never, { shouldDirty: true });
                      }
                      openSection(null);
                    }}
                  >
                    {body[key]}
                  </SectionCard>
                );
              })}
            </ul>
          ) : (
            <p className="text-ink-soft px-1 pb-2 text-sm">
              Tu guía aún no tiene secciones. Agrega una abajo.
            </p>
          )}
        </div>
      </section>

      {available.length ? (
        <section className="border-ink/15 rounded-3xl border-2 border-dashed p-4">
          <p className="text-ink-soft mb-3 text-xs font-bold tracking-wider">
            AGREGAR A TU GUÍA
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {available.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => {
                    setEnabled(key, true);
                    openSection(key);
                  }}
                  className="border-cream-dark hover:border-teal/50 flex h-full w-full items-start gap-3 rounded-2xl border bg-white p-4 text-left transition-colors"
                >
                  <span className="bg-cream text-teal-deep flex size-10 shrink-0 items-center justify-center rounded-xl">
                    {SECTIONS[key].icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{SECTIONS[key].title}</span>
                    <span className="text-ink-soft block text-sm">{SECTIONS[key].help}</span>
                  </span>
                  <span aria-hidden="true" className="text-teal-deep text-xl leading-none">+</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-xl">Apariencia e idioma</h2>
        <div className="space-y-1">
          <label htmlFor="guide-language" className="text-sm font-medium">
            Idioma en que escribes la guía
          </label>
          <select
            id="guide-language"
            className="border-cream-dark w-full rounded-xl border bg-white px-3 py-2"
            {...register("language")}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
          <p className="text-ink-soft text-xs">
            La guía abre en este idioma. Tus huéspedes pueden cambiar a ES/EN/FR:
            por ahora se traducen los títulos y botones, no tu texto.
          </p>
        </div>
        <TextField id="tagline" label="Lema" hint="Una frase corta bajo el nombre." registration={register("tagline")} error={errors.tagline?.message} />
        <AccentField
          value={content.theme?.accent ?? ""}
          registration={register("theme.accent")}
          error={errors.theme?.accent?.message}
          onPick={(value) =>
            form.setValue("theme.accent", value, { shouldDirty: true, shouldValidate: true })
          }
        />
      </section>
    </div>
  );
}

export function TimeField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const time = toTime24(value);
  const legacy = value.trim() && !time;
  return (
    <label
      htmlFor={id}
      className="border-cream-dark focus-within:border-teal-deep focus-within:ring-aqua/40 block rounded-2xl border bg-white px-4 py-3 focus-within:ring-2"
    >
      <span className="block text-sm font-semibold">{label}</span>
      <input
        id={id}
        type="time"
        value={time ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="text-ink mt-1 w-full bg-transparent text-lg outline-none"
      />
      {legacy ? (
        <span className="text-ink-soft block text-xs">
          Antes decía “{value}”. Elige una hora para reemplazarlo.
        </span>
      ) : null}
    </label>
  );
}

function StayFields({
  checkIn,
  checkOut,
  notes,
  notesField,
  onTime,
}: {
  checkIn: string;
  checkOut: string;
  notes: string;
  notesField: ReactNode;
  onTime: (field: "check_in" | "check_out", value: string) => void;
}) {
  const [showNotes, setShowNotes] = useState(Boolean(notes.trim()));
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <TimeField id="stay-in" label="Llegada desde" value={checkIn} onChange={(v) => onTime("check_in", v)} />
        <TimeField id="stay-out" label="Salida antes de" value={checkOut} onChange={(v) => onTime("check_out", v)} />
      </div>
      {showNotes ? (
        notesField
      ) : (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          className="border-ink/20 text-ink-soft hover:text-ink rounded-full border border-dashed px-4 py-2 text-sm font-semibold"
        >
          + Agregar indicaciones
        </button>
      )}
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
            className="border-cream-dark w-full rounded-xl border bg-white px-3 py-2"
            value={item}
            onChange={(event) => {
              const next = [...items];
              next[index] = event.target.value;
              onChange(next);
            }}
          />
          <button type="button" className="text-sm text-red-700" onClick={() => onChange(items.filter((_, i) => i !== index))}>
            Quitar
          </button>
        </div>
      ))}
      <AddButton disabled={items.length >= 15} onClick={() => onChange([...items, ""])}>
        Agregar regla
      </AddButton>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
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
