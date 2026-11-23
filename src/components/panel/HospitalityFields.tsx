"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";

import { usePanelI18n } from "@/components/panel/PanelLanguageProvider";
import type { HospitalityContent } from "@/lib/templates/hospitality/schema";
import type { PanelTranslator } from "@/lib/panel/i18n";
import { GuideIcon } from "@/lib/templates/icons";
import { displayTime, toTime24 } from "@/lib/templates/time";

import { AddButton, AccentField, TextField } from "./fields";
import { ListEditor, type ListRow, type ListSectionKey } from "./ListEditor";

type Form = UseFormReturn<HospitalityContent>;
type SectionKey =
  | "welcome"
  | "wifi"
  | "whatsapp"
  | "stay"
  | "rules"
  | "amenities"
  | "recommendations"
  | ExtraKey;

type ExtraKey =
  | ListSectionKey
  | "cleaning";

const icon = (path: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {path}
  </svg>
);

/** Optional services the host can add to the guide ("Agregar a tu guía"). */
const EXTRA_SECTIONS: Record<
  ExtraKey,
  { title: string; help: string; icon: ReactNode }
> = {
  tours: {
    title: "Tours recomendados",
    help: "Excursiones y actividades que recomiendas.",
    icon: <GuideIcon name="tours" />,
  },
  wellness: {
    title: "Bienestar y gimnasio",
    help: "Spa, bienestar y gimnasios cercanos.",
    icon: <GuideIcon name="wellness" />,
  },
  shopping: {
    title: "Compras y servicios",
    help: "Supermercados, farmacias y licorerías cercanas.",
    icon: <GuideIcon name="shopping" />,
  },
  emergency: {
    title: "Emergencias",
    help: "Números de emergencia y hospitales más cercanos.",
    icon: <GuideIcon name="emergency" />,
  },
  cleaning: {
    title: "Limpieza",
    help: "Información sobre la limpieza para los huéspedes.",
    icon: <GuideIcon name="cleaning" />,
  },
  minibar: {
    title: "Minibar y precios",
    help: "Qué hay en el minibar y cuánto cuesta.",
    icon: <GuideIcon name="minibar" />,
  },
  taxi: {
    title: "Taxi",
    help: "Compañías de taxi con teléfonos y enlaces.",
    icon: <GuideIcon name="taxi" />,
  },
  parking: {
    title: "Parqueos cercanos",
    help: "Dónde estacionar cerca de la casa.",
    icon: <GuideIcon name="parking" />,
  },
  faq: {
    title: "Preguntas frecuentes",
    help: "Respuestas a lo que más te preguntan.",
    icon: <GuideIcon name="faq" />,
  },
};

const PLACE_ROWS: readonly ListRow[] = [
  { field: "name", label: "Nombre" },
  { field: "category", label: "Tipo" },
  { field: "description", label: "Descripción", multiline: true },
  { field: "url", label: "Enlace", hint: "https://" },
];
const CONTACT_ROWS: readonly ListRow[] = [
  { field: "name", label: "Nombre" },
  { field: "phone", label: "Teléfono", hint: "Ejemplo: 2222 3333" },
  { field: "detail", label: "Detalle" },
  { field: "url", label: "Enlace", hint: "https://" },
];

/** How each list section is edited. `primary` is the field that must be filled. */
const LIST_CONFIG: Record<
  ListSectionKey,
  {
    rows: readonly ListRow[];
    blank: Record<string, string>;
    max: number;
    addLabel: string;
    primary: string;
  }
> = {
  tours: {
    rows: PLACE_ROWS,
    blank: { name: "", category: "", description: "", url: "" },
    max: 12,
    addLabel: "Agregar tour",
    primary: "name",
  },
  wellness: {
    rows: PLACE_ROWS,
    blank: { name: "", category: "", description: "", url: "" },
    max: 12,
    addLabel: "Agregar lugar",
    primary: "name",
  },
  shopping: {
    rows: PLACE_ROWS,
    blank: { name: "", category: "", description: "", url: "" },
    max: 12,
    addLabel: "Agregar lugar",
    primary: "name",
  },
  parking: {
    rows: PLACE_ROWS,
    blank: { name: "", category: "", description: "", url: "" },
    max: 12,
    addLabel: "Agregar parqueo",
    primary: "name",
  },
  emergency: {
    rows: CONTACT_ROWS,
    blank: { name: "", phone: "", detail: "", url: "" },
    max: 12,
    addLabel: "Agregar contacto",
    primary: "name",
  },
  taxi: {
    rows: CONTACT_ROWS,
    blank: { name: "", phone: "", detail: "", url: "" },
    max: 12,
    addLabel: "Agregar compañía",
    primary: "name",
  },
  minibar: {
    rows: [
      { field: "name", label: "Producto" },
      { field: "price", label: "Precio", hint: "Ejemplo: $3 o ₡1.500" },
      { field: "detail", label: "Detalle" },
    ],
    blank: { name: "", price: "", detail: "" },
    max: 30,
    addLabel: "Agregar producto",
    primary: "name",
  },
  faq: {
    rows: [
      { field: "question", label: "Pregunta" },
      { field: "answer", label: "Respuesta", multiline: true },
    ],
    blank: { question: "", answer: "" },
    max: 20,
    addLabel: "Agregar pregunta",
    primary: "question",
  },
};

function isListSection(key: SectionKey): key is ListSectionKey {
  return key in LIST_CONFIG;
}

const SECTIONS: Record<
  SectionKey,
  { title: string; help: string; icon: ReactNode }
> = {
  ...EXTRA_SECTIONS,
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
    icon: icon(
      <path d="M12 3l2.6 5.6 6 .6-4.5 4 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.5-4 6-.6z" />,
    ),
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
  "tours",
  "wellness",
  "shopping",
  "emergency",
  "cleaning",
  "minibar",
  "taxi",
  "parking",
  "faq",
];

function truncate(value: string, max = 70): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/** Resumen de una línea y si la sección tiene lo mínimo para mostrarse. */
function status(
  key: SectionKey,
  c: HospitalityContent,
  t: PanelTranslator,
): { ready: boolean; summary: string } {
  switch (key) {
    case "welcome":
      return {
        ready: Boolean(c.welcome.message.trim()),
        summary: truncate(c.welcome.message),
      };
    case "wifi":
      return {
        ready: Boolean(c.wifi.network || c.wifi.password),
        summary: [c.wifi.network, c.wifi.password && t("contraseña agregada")]
          .filter(Boolean)
          .join(" · "),
      };
    case "whatsapp":
      return {
        ready: Boolean(c.whatsapp.phone),
        summary: c.whatsapp.phone ? `WhatsApp ${c.whatsapp.phone}` : "",
      };
    case "stay":
      return {
        ready: Boolean(c.stay.check_in || c.stay.check_out || c.stay.notes),
        summary:
          [
            c.stay.check_in &&
              t("Llegada {time}", { time: displayTime(c.stay.check_in) }),
            c.stay.check_out &&
              t("Salida {time}", { time: displayTime(c.stay.check_out) }),
          ]
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
          ? truncate(
              `${t(items.length === 1 ? "1 lugar" : "{count} lugares", { count: items.length })} · ${items.map((r) => r.name).join(", ")}`,
            )
          : "",
      };
    }
    case "cleaning":
      return {
        ready: Boolean(c.cleaning.message.trim()),
        summary: truncate(c.cleaning.message),
      };
    default: {
      // List sections: ready with one filled item; the summary names them.
      const config = LIST_CONFIG[key];
      const items = (c[key].items as Record<string, string>[])
        .map((item) => item[config.primary]?.trim() ?? "")
        .filter(Boolean);
      return { ready: items.length > 0, summary: truncate(items.join(" · ")) };
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
  const { t } = usePanelI18n();
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
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
            {t(info.title)}
            {ready ? null : (
              <span className="text-ink-soft text-xs font-bold">
                {t("Falta completar")}
              </span>
            )}
          </p>
          <p className="text-ink-soft truncate text-sm">
            {summary || t(info.help)}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={onOpen}
          className="text-teal-deep hover:bg-cream shrink-0 rounded-lg px-2 py-1 text-sm font-semibold"
        >
          {open ? t("Cerrar") : t("Editar")}
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
              {t("Quitar de la guía")}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="text-ink-soft hover:text-ink rounded-full px-4 py-2 text-sm font-semibold"
              >
                {t("Cancelar")}
              </button>
              <button
                type="button"
                onClick={onOpen}
                className="bg-sand text-ink hover:bg-sand-hover rounded-full px-5 py-2 text-sm font-semibold"
              >
                {t("Listo")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Services every plan includes. The rest (recommendations and the optional
 * services) need Essential or Plus.
 */
const BASIC_SECTIONS: ReadonlySet<SectionKey> = new Set([
  "welcome",
  "wifi",
  "whatsapp",
  "stay",
  "rules",
]);

export function HospitalityFields({
  form,
  fullServices = false,
}: {
  form: Form;
  /** The owner's plan includes every service (Essential and Plus). */
  fullServices?: boolean;
}) {
  const { t } = usePanelI18n();
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
  const amenities = useFieldArray({
    control: form.control,
    name: "amenities.items",
  });
  const recommendations = useFieldArray({
    control: form.control,
    name: "recommendations.items",
  });

  // Si al guardar hay errores, abre la primera sección que los tiene para
  // que se vean (ajuste de estado durante el render, sin efecto).
  const submitCount = form.formState.submitCount;
  const [seenSubmit, setSeenSubmit] = useState(submitCount);
  if (submitCount !== seenSubmit) {
    setSeenSubmit(submitCount);
    const withError = ORDER.find((key) => errors[key]);
    if (withError && withError !== open) openSection(withError);
  }

  const setEnabled = (key: SectionKey, value: boolean) =>
    form.setValue(`${key}.enabled`, value, { shouldDirty: true });

  /** Cierra la sección abierta solo si es válida; si no, quedan los errores a la vista. */
  const switchTo = async (next: SectionKey | null) => {
    if (open && !(await form.trigger(open))) return;
    openSection(next);
  };

  /** Quita los elementos vacíos (sin nombre) y saca la sección de la guía. */
  const hideSection = async (key: SectionKey) => {
    if (key === "rules") {
      const items = form.getValues("rules.items");
      const kept = items.filter((r) => r.trim());
      if (kept.length !== items.length) {
        form.setValue("rules.items", kept, { shouldDirty: true });
      }
    }
    if (key === "amenities") {
      const blank = form
        .getValues("amenities.items")
        .flatMap((a, i) => (a.label.trim() ? [] : [i]));
      if (blank.length) amenities.remove(blank);
    }
    if (key === "recommendations") {
      const blank = form
        .getValues("recommendations.items")
        .flatMap((r, i) => (r.name.trim() ? [] : [i]));
      if (blank.length) recommendations.remove(blank);
    }
    if (isListSection(key)) {
      const primary = LIST_CONFIG[key].primary;
      const items = form.getValues(`${key}.items`) as unknown as Record<
        string,
        string
      >[];
      const kept = items.filter((item) => item[primary]?.trim());
      if (kept.length !== items.length) {
        form.setValue(`${key}.items`, kept as never, { shouldDirty: true });
      }
    }
    // Lo que sigue inválido (p. ej. un enlace mal escrito) se queda abierto.
    if (!(await form.trigger(key))) return;
    setEnabled(key, false);
    openSection(null);
  };

  // Una sección oculta con errores se sigue mostrando, para poder corregirla.
  const shown = ORDER.filter((key) => content[key]?.enabled || errors[key]);
  // "Servicios del lugar" is no longer offered; guides that already use it keep it.
  const available = ORDER.filter(
    (key) => key !== "amenities" && !content[key]?.enabled && !errors[key],
  );
  const readyCount = shown.filter(
    (key) => status(key, content, t).ready,
  ).length;

  const body: Record<SectionKey, ReactNode> = {
    welcome: (
      <>
        <TextField
          id="welcome-title"
          label={t("Título")}
          registration={register("welcome.title")}
          error={errors.welcome?.title?.message}
        />
        <TextField
          id="welcome-message"
          label={t("Mensaje")}
          multiline
          registration={register("welcome.message")}
          error={errors.welcome?.message?.message}
        />
      </>
    ),
    wifi: (
      <>
        <TextField
          id="wifi-network"
          label={t("Nombre de la red")}
          registration={register("wifi.network")}
          error={errors.wifi?.network?.message}
        />
        <TextField
          id="wifi-password"
          label={t("Contraseña")}
          hint={t(
            "Se muestra a tus huéspedes. Déjala vacía si la red es abierta.",
          )}
          registration={register("wifi.password")}
          error={errors.wifi?.password?.message}
        />
        <TextField
          id="wifi-notes"
          label={t("Notas")}
          registration={register("wifi.notes")}
          error={errors.wifi?.notes?.message}
        />
      </>
    ),
    whatsapp: (
      <>
        <TextField
          id="wa-phone"
          label={"WhatsApp"}
          hint={t("Ejemplo: 8899 7060")}
          registration={register("whatsapp.phone")}
          error={errors.whatsapp?.phone?.message}
        />
        <TextField
          id="wa-label"
          label={t("Texto del botón")}
          registration={register("whatsapp.label")}
          error={errors.whatsapp?.label?.message}
        />
        <TextField
          id="wa-message"
          label={t("Mensaje inicial")}
          multiline
          registration={register("whatsapp.message")}
          error={errors.whatsapp?.message?.message}
        />
      </>
    ),
    stay: (
      <StayFields
        checkIn={content.stay?.check_in ?? ""}
        checkOut={content.stay?.check_out ?? ""}
        notes={content.stay?.notes ?? ""}
        notesField={
          <TextField
            id="stay-notes"
            label={t("Indicaciones")}
            hint={t("Dónde están las llaves, qué hacer antes de irse…")}
            multiline
            registration={register("stay.notes")}
            error={errors.stay?.notes?.message}
          />
        }
        onTime={(field, value) =>
          form.setValue(`stay.${field}`, value, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />
    ),
    rules: (
      <RuleList
        items={content.rules?.items ?? []}
        error={firstMessage(errors.rules?.items)}
        onChange={(items) =>
          form.setValue("rules.items", items, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />
    ),
    amenities: (
      <div className="space-y-3">
        {amenities.fields.map((field, index) => (
          <div
            key={field.id}
            className="border-cream-dark space-y-2 rounded-xl border p-3"
          >
            <TextField
              id={`amenity-label-${index}`}
              label={t("Nombre")}
              registration={register(`amenities.items.${index}.label`)}
              error={errors.amenities?.items?.[index]?.label?.message}
            />
            <TextField
              id={`amenity-detail-${index}`}
              label={t("Detalle")}
              registration={register(`amenities.items.${index}.detail`)}
              error={errors.amenities?.items?.[index]?.detail?.message}
            />
            <button
              type="button"
              className="text-sm text-red-700"
              onClick={() => amenities.remove(index)}
            >
              {t("Quitar")}
            </button>
          </div>
        ))}
        <AddButton
          disabled={amenities.fields.length >= 20}
          onClick={() => amenities.append({ label: "", detail: "" })}
        >
          {t("Agregar servicio")}
        </AddButton>
      </div>
    ),
    ...(Object.fromEntries(
      (Object.keys(LIST_CONFIG) as ListSectionKey[]).map((key) => [
        key,
        <ListEditor
          key={key}
          form={form}
          name={key}
          rows={LIST_CONFIG[key].rows}
          blank={LIST_CONFIG[key].blank}
          max={LIST_CONFIG[key].max}
          addLabel={t(LIST_CONFIG[key].addLabel)}
        />,
      ]),
    ) as Record<ListSectionKey, ReactNode>),
    cleaning: (
      <TextField
        id="cleaning-message"
        label={t("Información de limpieza")}
        hint={t("Horarios, cambio de sábanas, qué deben dejar listo…")}
        multiline
        registration={register("cleaning.message")}
        error={errors.cleaning?.message?.message}
      />
    ),
    recommendations: (
      <div className="space-y-3">
        {recommendations.fields.map((field, index) => (
          <div
            key={field.id}
            className="border-cream-dark space-y-2 rounded-xl border p-3"
          >
            <TextField
              id={`rec-name-${index}`}
              label={t("Nombre")}
              registration={register(`recommendations.items.${index}.name`)}
              error={errors.recommendations?.items?.[index]?.name?.message}
            />
            <TextField
              id={`rec-category-${index}`}
              label={t("Tipo")}
              hint={t("Restaurante, playa, tour…")}
              registration={register(`recommendations.items.${index}.category`)}
              error={errors.recommendations?.items?.[index]?.category?.message}
            />
            <TextField
              id={`rec-description-${index}`}
              label={t("Descripción")}
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
              label={t("Enlace")}
              hint={"https://"}
              registration={register(`recommendations.items.${index}.url`)}
              error={errors.recommendations?.items?.[index]?.url?.message}
            />
            <button
              type="button"
              className="text-sm text-red-700"
              onClick={() => recommendations.remove(index)}
            >
              {t("Quitar")}
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
          {t("Agregar recomendación")}
        </AddButton>
      </div>
    ),
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl">{t("Información para tus huéspedes")}</h2>
          {shown.length ? (
            <p className="text-ink-soft text-sm">
              {t("{ready} de {total} listas", {
                ready: readyCount,
                total: shown.length,
              })}
            </p>
          ) : null}
        </div>
        <div className="bg-cream/70 rounded-3xl p-3 sm:p-4">
          <p className="text-ink-soft mb-3 px-1 text-xs font-bold tracking-wider">
            {t("EN TU GUÍA")}
            <span className="ml-1 font-normal tracking-normal">
              {t("· en el orden en que la ven")}
            </span>
          </p>
          {shown.length ? (
            <ul className="space-y-2">
              {shown.map((key) => {
                const s = status(key, content, t);
                return (
                  <SectionCard
                    key={key}
                    sectionKey={key}
                    ready={s.ready}
                    summary={s.summary}
                    open={open === key}
                    onOpen={() => void switchTo(open === key ? null : key)}
                    onHide={() => void hideSection(key)}
                    onCancel={() => {
                      if (snapshot) {
                        form.setValue(key, snapshot as never, {
                          shouldDirty: true,
                        });
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
              {t("Tu guía aún no tiene secciones. Agrega una abajo.")}
            </p>
          )}
          {available.length ? (
            <div className="border-ink/15 mt-4 rounded-2xl border-2 border-dashed p-3">
              <p className="text-ink-soft mb-3 text-xs font-bold tracking-wider">
                {t("AGREGAR A TU GUÍA")}
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {available.map((key) =>
                  !fullServices && !BASIC_SECTIONS.has(key) ? (
                    <li key={key}>
                      <Link
                        href="/panel/configuracion#planes"
                        className="border-cream-dark hover:border-teal/50 flex h-full w-full items-start gap-3 rounded-2xl border border-dashed bg-white/60 p-4 text-left transition-colors"
                      >
                        <span className="bg-cream text-ink-soft flex size-10 shrink-0 items-center justify-center rounded-xl">
                          {SECTIONS[key].icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">
                            {t(SECTIONS[key].title)}
                          </span>
                          <span className="text-ink-soft block text-sm">
                            {t("Disponible en Essential y Plus.")}
                          </span>
                        </span>
                        <span className="bg-sand/30 text-ink rounded-full px-2 py-0.5 text-xs font-bold">
                          {t("Ver planes")}
                        </span>
                      </Link>
                    </li>
                  ) : (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={async () => {
                        if (open && !(await form.trigger(open))) return;
                        setEnabled(key, true);
                        openSection(key);
                      }}
                      className="border-cream-dark hover:border-teal/50 flex h-full w-full items-start gap-3 rounded-2xl border bg-white p-4 text-left transition-colors"
                    >
                      <span className="bg-cream text-teal-deep flex size-10 shrink-0 items-center justify-center rounded-xl">
                        {SECTIONS[key].icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">
                          {t(SECTIONS[key].title)}
                        </span>
                        <span className="text-ink-soft block text-sm">
                          {t(SECTIONS[key].help)}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-teal-deep text-xl leading-none"
                      >
                        +
                      </span>
                    </button>
                  </li>
                  ),
                )}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl">{t("Apariencia e idioma")}</h2>
        <div className="space-y-1">
          <label htmlFor="guide-language" className="text-sm font-medium">
            {t("Idioma en que escribes la guía")}
          </label>
          <select
            id="guide-language"
            className="border-cream-dark w-full rounded-xl border bg-white px-3 py-2"
            {...register("language")}
          >
            <option value="es">{"Español"}</option>
            <option value="en">{"English"}</option>
            <option value="fr">{"Français"}</option>
          </select>
          <p className="text-ink-soft text-xs">
            {t(
              "La guía abre en este idioma. Tus huéspedes pueden cambiar a ES/EN/FR; tu texto se muestra en otros idiomas si lo traduces abajo.",
            )}
          </p>
        </div>
        <TextField
          id="tagline"
          label={t("Lema")}
          hint={t("Una frase corta bajo el nombre.")}
          registration={register("tagline")}
          error={errors.tagline?.message}
        />
        <AccentField
          value={content.theme?.accent ?? ""}
          error={errors.theme?.accent?.message}
          onPick={(value) =>
            form.setValue("theme.accent", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
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
  const { t } = usePanelI18n();
  const time = toTime24(value);
  const legacy = value.trim() && !time;
  return (
    <label
      htmlFor={id}
      className="border-cream-dark focus-within:border-teal-deep focus-within:ring-aqua/40 block rounded-2xl border bg-white px-4 py-3 focus-within:ring-2"
    >
      <span className="block text-sm font-semibold">{t(label)}</span>
      <input
        id={id}
        type="time"
        value={time ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="text-ink mt-1 w-full bg-transparent text-lg outline-none"
      />
      {legacy ? (
        <span className="text-ink-soft block text-xs">
          {t("Antes decía “{value}”. Elige una hora para reemplazarlo.", {
            value,
          })}
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
  const { t } = usePanelI18n();
  const [showNotes, setShowNotes] = useState(Boolean(notes.trim()));
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <TimeField
          id="stay-in"
          label={t("Llegada desde")}
          value={checkIn}
          onChange={(v) => onTime("check_in", v)}
        />
        <TimeField
          id="stay-out"
          label={t("Salida antes de")}
          value={checkOut}
          onChange={(v) => onTime("check_out", v)}
        />
      </div>
      {showNotes ? (
        notesField
      ) : (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          className="border-ink/20 text-ink-soft hover:text-ink rounded-full border border-dashed px-4 py-2 text-sm font-semibold"
        >
          {t("+ Agregar indicaciones")}
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
  const { t } = usePanelI18n();
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            aria-label={`${t("Regla")} ${index + 1}`}
            className="border-cream-dark w-full rounded-xl border bg-white px-3 py-2"
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
            {t("Quitar")}
          </button>
        </div>
      ))}
      <AddButton
        disabled={items.length >= 15}
        onClick={() => onChange([...items, ""])}
      >
        {t("Agregar regla")}
      </AddButton>
      {error ? <p className="text-sm text-red-700">{t(error)}</p> : null}
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
