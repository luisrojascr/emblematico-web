"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import {
  createProperty,
  importFromListing,
} from "@/app/(panel)/panel/hospedajes/nuevo/actions";
import {
  EMPTY_WIZARD,
  WIZARD_LANGUAGES,
  wizardSchema,
  type WizardForm,
  type WizardSection,
} from "@/lib/panel/wizard";
import { usePanelI18n } from "@/components/panel/PanelLanguageProvider";
import { displayTime } from "@/lib/templates/time";
import type { PanelTranslator } from "@/lib/panel/i18n";

import { TimeField } from "./HospitalityFields";
import {
  panelInputClass,
  panelPrimaryButtonClass,
  panelSecondaryButtonClass,
} from "./ui";

type Values = WizardForm;

const STEPS = [
  {
    title: "Crea tu hospedaje",
    help: "El nombre que ven tus huéspedes arriba de su guía. Una foto les ayuda a saber que están en el lugar correcto.",
  },
  {
    title: "Agrega lo esencial",
    help: "Lo primero que preguntan tus huéspedes. Marca lo que aplique: puedes agregar más cuando quieras.",
  },
  {
    title: "Revisa y crea",
    help: "Así queda tu guía. Se crea como borrador: tú decides cuándo publicarla.",
  },
] as const;

const SECTION_INFO: Record<WizardSection, { title: string; help: string }> = {
  welcome: {
    title: "Mensaje de bienvenida",
    help: "Lo primero que leen al abrir la guía.",
  },
  wifi: { title: "Wi‑Fi", help: "Casi siempre es lo primero que buscan." },
  contact: {
    title: "Cómo contactarte",
    help: "Un botón de WhatsApp para cuando algo no va bien.",
  },
  stay: {
    title: "Llegada y salida",
    help: "Los horarios y lo que deben hacer antes de irse.",
  },
  rules: { title: "Reglas de la casa", help: "Lo que se vale y lo que no." },
  amenities: {
    title: "Servicios del lugar",
    help: "Piscina, parqueo, aire acondicionado…",
  },
  recommendations: {
    title: "Recomendaciones",
    help: "Restaurantes, playas y lugares que te gustan.",
  },
};

const SECTION_ORDER: readonly WizardSection[] = [
  "contact",
  "welcome",
  "wifi",
  "stay",
  "rules",
  "amenities",
  "recommendations",
];

function Field({
  id,
  label,
  hint,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  const { t } = usePanelI18n();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {t(label)}
        {optional ? (
          <span className="text-ink-soft font-normal"> {t("— opcional")}</span>
        ) : null}
      </label>
      {children}
      {hint ? <p className="text-ink-soft text-xs">{t(hint)}</p> : null}
    </div>
  );
}

function OptionCard({
  id,
  title,
  help,
  on,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  help: string;
  on: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const { t } = usePanelI18n();
  return (
    <div
      className={`rounded-2xl border-2 bg-white transition-colors ${
        on ? "border-teal" : "border-cream-dark hover:border-teal/40"
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={on}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className="flex w-full items-start gap-4 p-4 text-left"
      >
        <span
          aria-hidden="true"
          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            on ? "border-teal bg-teal text-white" : "border-ink/25"
          }`}
        >
          {on ? (
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          ) : null}
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">{t(title)}</span>
          <span className="text-ink-soft block text-sm">{t(help)}</span>
        </span>
      </button>
      {on ? (
        <div id={`${id}-panel`} className="space-y-4 px-4 pb-5 sm:pl-14">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function ListEditor({
  id,
  label,
  items,
  placeholder,
  addLabel,
  max,
  onChange,
}: {
  id: string;
  label: string;
  items: string[];
  placeholder: string;
  addLabel: string;
  max: number;
  onChange: (items: string[]) => void;
}) {
  const { t } = usePanelI18n();
  const rows = items.length ? items : [""];
  return (
    <div className="space-y-2">
      {rows.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            id={`${id}-${index}`}
            aria-label={`${t(label)} ${index + 1}`}
            className={panelInputClass}
            value={item}
            placeholder={t(placeholder)}
            onChange={(event) =>
              onChange(
                rows.map((v, i) => (i === index ? event.target.value : v)),
              )
            }
          />
          {rows.length > 1 ? (
            <button
              type="button"
              aria-label={`${t("Quitar")} ${t(label)} ${index + 1}`}
              className={panelSecondaryButtonClass}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              ✕
            </button>
          ) : null}
        </div>
      ))}
      {rows.length < max ? (
        <button
          type="button"
          className="text-teal-deep text-sm font-semibold"
          onClick={() => onChange([...rows, ""])}
        >
          + {t(addLabel)}
        </button>
      ) : null}
    </div>
  );
}

/** Sin fetch(): la política de seguridad (connect-src) bloquea las URL data:. */
function fileFromDataUrl(dataUrl: string, name: string): File | null {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const binary = atob(match[2]!);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: match[1] });
}

function summaryOf(
  section: WizardSection,
  values: Values,
  t: PanelTranslator,
): string {
  switch (section) {
    case "welcome":
      return t(values.welcome.trim() ? "Escrito" : "Vacío");
    case "wifi":
      return values.wifiNetwork || t("Sin nombre de red");
    case "contact":
      return values.whatsapp || t("Sin número");
    case "stay":
      return (
        [
          values.checkIn &&
            t("Llegada {time}", { time: displayTime(values.checkIn) }),
          values.checkOut &&
            t("Salida {time}", { time: displayTime(values.checkOut) }),
        ]
          .filter(Boolean)
          .join(" · ") || t("Sin horarios")
      );
    case "rules":
      return t("{count} reglas", {
        count: values.rules.filter((r) => r.trim()).length,
      });
    case "amenities":
      return t("{count} servicios", {
        count: values.amenities.filter((a) => a.trim()).length,
      });
    case "recommendations":
      return t("{count} lugares", {
        count: values.recommendations.filter((r) => r.name.trim()).length,
      });
  }
}

export function PropertyWizard({ closeHref }: { closeHref: string }) {
  const { t } = usePanelI18n();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(() => ({
    ...EMPTY_WIZARD,
    sections: { ...EMPTY_WIZARD.sections, wifi: true, contact: true },
  }));
  const [cover, setCover] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [listingUrl, setListingUrl] = useState("");
  const [ownsContent, setOwnsContent] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importFields, setImportFields] = useState<string[]>([]);
  const [importOk, setImportOk] = useState(false);
  const [importing, startImport] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const [creating, startCreate] = useTransition();

  const preview = useMemo(
    () => (cover ? URL.createObjectURL(cover) : null),
    [cover],
  );
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const toggle = (section: WizardSection) =>
    setValues((current) => ({
      ...current,
      sections: { ...current.sections, [section]: !current.sections[section] },
    }));

  function choosePhoto(file: File | null) {
    setPhotoError(null);
    if (!file) return setCover(null);
    if (
      file.size > 5 * 1024 * 1024 ||
      (file.type !== "" && !/^image\/(jpeg|png|webp)$/.test(file.type))
    ) {
      setPhotoError("La imagen debe ser JPG, PNG o WebP, de hasta 5 MB.");
      return;
    }
    setCover(file);
  }

  function runImport() {
    setImportMessage(null);
    setImportOk(false);
    startImport(async () => {
      const result = await importFromListing(listingUrl, ownsContent);
      if (!result.ok) {
        setImportMessage(result.message);
        return;
      }
      const { data, photo } = result;
      setValues((current) => ({
        ...current,
        name: current.name || data.name,
        welcome: current.welcome || data.description,
        checkIn: current.checkIn || data.checkIn,
        checkOut: current.checkOut || data.checkOut,
        amenities: current.amenities.length
          ? current.amenities
          : data.amenities,
        rules: current.rules.length ? current.rules : data.rules,
        // Lo que llegó del anuncio queda marcado para que lo revise.
        sections: {
          ...current.sections,
          welcome: current.sections.welcome || Boolean(data.description),
          stay: current.sections.stay || Boolean(data.checkIn || data.checkOut),
          amenities: current.sections.amenities || data.amenities.length > 0,
          rules: current.sections.rules || data.rules.length > 0,
        },
      }));
      const photoFile =
        photo && !cover ? fileFromDataUrl(photo, "anuncio") : null;
      if (photoFile) setCover(photoFile);
      const found = [
        data.name && "nombre",
        photoFile && "foto",
        data.description && "descripción",
        data.amenities.length > 0 && "servicios",
        (data.checkIn || data.checkOut) && "horarios",
        data.rules.length > 0 && "reglas",
      ].filter((field): field is string => Boolean(field));
      setImportOk(true);
      setImportFields(found);
      setImportMessage(
        "Listo, trajimos: {fields}. Revisa y corrige lo que quieras en el siguiente paso.",
      );
    });
  }

  function go(to: number) {
    setError(null);
    if (to > 0 && !values.name.trim()) {
      setStep(0);
      setError("Escribe el nombre de tu hospedaje.");
      return;
    }
    if (to === 2) {
      const parsed = wizardSchema.safeParse(values);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Revisa los datos.");
        return;
      }
    }
    setStep(Math.max(0, Math.min(to, STEPS.length - 1)));
  }

  function create() {
    setError(null);
    const parsed = wizardSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los datos.");
      return;
    }
    const data = new FormData();
    data.set("values", JSON.stringify(values));
    if (cover) data.set("cover", cover);
    startCreate(async () => {
      const result = await createProperty(data);
      if (result) setError(result.message);
    });
  }

  const last = step === STEPS.length - 1;
  const busy = importing || creating;
  const chosen = SECTION_ORDER.filter((s) => values.sections[s]);

  return (
    <div
      role="dialog"
      aria-labelledby="wizard-title"
      className="border-cream-dark shadow-ink/10 mx-auto flex max-h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border bg-white shadow-xl"
    >
      <div className="flex items-center gap-4 px-6 pt-6 sm:px-8">
        {step > 0 ? (
          <button
            type="button"
            aria-label={t("Paso anterior")}
            disabled={busy}
            onClick={() => go(step - 1)}
            className="border-cream-dark text-ink-soft hover:text-ink rounded-xl border px-3 py-2 text-sm"
          >
            ‹
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-teal-deep text-xs font-bold tracking-wider">
            {t("Paso {step} de {total}", {
              step: step + 1,
              total: STEPS.length,
            })}
          </p>
          <div className="mt-2 flex gap-2" aria-hidden="true">
            {STEPS.map((_, index) => (
              <span
                key={index}
                className={`h-1 flex-1 rounded-full ${index <= step ? "bg-sand" : "bg-cream-dark"}`}
              />
            ))}
          </div>
        </div>
        <Link
          href={closeHref}
          aria-label={t("Cerrar sin guardar")}
          className="border-cream-dark text-ink-soft hover:text-ink rounded-xl border px-3 py-2 text-sm"
        >
          ✕
        </Link>
      </div>

      <div className="px-6 pt-6 sm:px-8">
        <h2 id="wizard-title" className="text-2xl">
          {t(STEPS[step]!.title)}
        </h2>
        <p className="text-ink-soft mt-1 text-sm">{t(STEPS[step]!.help)}</p>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-8">
        {step === 0 ? (
          <div className="space-y-5">
            <div className="bg-cream space-y-3 rounded-2xl p-4">
              <Field
                id="listing"
                label={t("¿Ya tienes tu anuncio en Airbnb o Booking?")}
                hint={t(
                  "Pega el enlace y traemos nombre, foto, descripción, servicios y horarios. Tú revisas todo antes de crear.",
                )}
                optional
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="listing"
                    type="url"
                    inputMode="url"
                    className={panelInputClass}
                    placeholder={"https://www.airbnb.com/rooms/…"}
                    value={listingUrl}
                    onChange={(event) => setListingUrl(event.target.value)}
                  />
                  <button
                    type="button"
                    className={panelSecondaryButtonClass}
                    disabled={busy || !listingUrl.trim() || !ownsContent}
                    onClick={runImport}
                  >
                    {importing ? t("Leyendo…") : t("Traer datos")}
                  </button>
                </div>
              </Field>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={ownsContent}
                  onChange={(event) => setOwnsContent(event.target.checked)}
                />
                <span>
                  {t(
                    "Confirmo que este anuncio y su contenido (textos y fotos) son míos o tengo permiso para usarlos.",
                  )}
                </span>
              </label>
              {importMessage ? (
                <p
                  role={importOk ? "status" : "alert"}
                  className={`text-sm ${importOk ? "text-teal-deep" : "text-red-700"}`}
                >
                  {t(importMessage, {
                    fields: importFields.map((field) => t(field)).join(", "),
                  })}
                </p>
              ) : null}
            </div>

            <Field
              id="name"
              label={t("¿Cómo le dicen tus huéspedes a este lugar?")}
            >
              <input
                id="name"
                className={panelInputClass}
                value={values.name}
                maxLength={120}
                placeholder={"Casa Bahía"}
                onChange={(event) => set("name", event.target.value)}
              />
            </Field>

            <Field
              id="language"
              label={t("Tu guía está escrita en")}
              hint={t(
                "El idioma en que escribes la guía. Todavía no cuenta como traducción.",
              )}
            >
              <select
                id="language"
                className={panelInputClass}
                value={values.language}
                onChange={(event) =>
                  set("language", event.target.value as Values["language"])
                }
              >
                {WIZARD_LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="photo" label={t("Foto")} optional>
              <div className="border-cream-dark flex items-center gap-3 rounded-xl border p-3">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt={t("Foto del hospedaje")}
                    className="size-14 rounded-lg object-cover"
                  />
                ) : (
                  <span className="bg-cream-dark/60 text-ink-soft flex size-14 items-center justify-center rounded-lg text-xs">
                    {t("Sin foto")}
                  </span>
                )}
                <span className="min-w-0 flex-1 text-sm font-semibold">
                  {cover ? t("Imagen agregada") : t("Subir imagen")}
                </span>
                <label
                  className={`${panelSecondaryButtonClass} cursor-pointer`}
                >
                  {cover ? t("Cambiar") : t("Elegir")}
                  <input
                    id="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) =>
                      choosePhoto(event.target.files?.[0] ?? null)
                    }
                  />
                </label>
                {cover ? (
                  <button
                    type="button"
                    className={panelSecondaryButtonClass}
                    aria-label={t("Quitar foto")}
                    onClick={() => choosePhoto(null)}
                  >
                    ✕
                  </button>
                ) : null}
              </div>
              {photoError ? (
                <p role="alert" className="text-sm text-red-700">
                  {t(photoError)}
                </p>
              ) : null}
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <OptionCard
              id="contact"
              {...SECTION_INFO.contact}
              on={values.sections.contact}
              onToggle={() => toggle("contact")}
            >
              <Field
                id="whatsapp"
                label={"WhatsApp"}
                hint={t("Con código de país. Si son 8 dígitos le ponemos 506.")}
              >
                <input
                  id="whatsapp"
                  inputMode="tel"
                  className={panelInputClass}
                  value={values.whatsapp}
                  maxLength={30}
                  placeholder="8899 7060"
                  onChange={(event) => set("whatsapp", event.target.value)}
                />
              </Field>
            </OptionCard>

            <OptionCard
              id="welcome"
              {...SECTION_INFO.welcome}
              on={values.sections.welcome}
              onToggle={() => toggle("welcome")}
            >
              <Field id="welcome-text" label={t("Mensaje")}>
                <textarea
                  id="welcome-text"
                  rows={5}
                  className={panelInputClass}
                  value={values.welcome}
                  maxLength={800}
                  onChange={(event) => set("welcome", event.target.value)}
                />
              </Field>
            </OptionCard>

            <OptionCard
              id="wifi"
              {...SECTION_INFO.wifi}
              on={values.sections.wifi}
              onToggle={() => toggle("wifi")}
            >
              <Field id="wifi-network" label={t("Nombre de la red")}>
                <input
                  id="wifi-network"
                  className={panelInputClass}
                  value={values.wifiNetwork}
                  maxLength={60}
                  placeholder={"CasaBahia-Huespedes"}
                  onChange={(event) => set("wifiNetwork", event.target.value)}
                />
              </Field>
              <Field
                id="wifi-password"
                label={t("Contraseña")}
                hint={t(
                  "Se muestra a tus huéspedes en la guía. Déjala vacía si la red es abierta.",
                )}
              >
                <input
                  id="wifi-password"
                  className={panelInputClass}
                  value={values.wifiPassword}
                  maxLength={80}
                  onChange={(event) => set("wifiPassword", event.target.value)}
                />
              </Field>
            </OptionCard>

            <OptionCard
              id="stay"
              {...SECTION_INFO.stay}
              on={values.sections.stay}
              onToggle={() => toggle("stay")}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <TimeField
                  id="check-in"
                  label={t("Llegada desde")}
                  value={values.checkIn}
                  onChange={(value) => set("checkIn", value)}
                />
                <TimeField
                  id="check-out"
                  label={t("Salida antes de")}
                  value={values.checkOut}
                  onChange={(value) => set("checkOut", value)}
                />
              </div>
              <Field id="stay-notes" label={t("Antes de irte")} optional>
                <textarea
                  id="stay-notes"
                  rows={3}
                  className={panelInputClass}
                  value={values.stayNotes}
                  maxLength={400}
                  placeholder={t("Deja las llaves en la caja y apaga el aire.")}
                  onChange={(event) => set("stayNotes", event.target.value)}
                />
              </Field>
            </OptionCard>

            <OptionCard
              id="rules"
              {...SECTION_INFO.rules}
              on={values.sections.rules}
              onToggle={() => toggle("rules")}
            >
              <ListEditor
                id="rule"
                label={t("Regla")}
                items={values.rules}
                placeholder={t("No se permite fumar")}
                addLabel={t("Agregar regla")}
                max={15}
                onChange={(items) => set("rules", items)}
              />
            </OptionCard>

            <OptionCard
              id="amenities"
              {...SECTION_INFO.amenities}
              on={values.sections.amenities}
              onToggle={() => toggle("amenities")}
            >
              <ListEditor
                id="amenity"
                label={t("Servicio")}
                items={values.amenities}
                placeholder={t("Piscina")}
                addLabel={t("Agregar servicio")}
                max={20}
                onChange={(items) => set("amenities", items)}
              />
            </OptionCard>

            <OptionCard
              id="recommendations"
              {...SECTION_INFO.recommendations}
              on={values.sections.recommendations}
              onToggle={() => toggle("recommendations")}
            >
              {(values.recommendations.length
                ? values.recommendations
                : [{ name: "", description: "" }]
              ).map((place, index, rows) => (
                <div
                  key={index}
                  className="border-cream-dark space-y-2 rounded-xl border p-3"
                >
                  <div className="flex gap-2">
                    <input
                      aria-label={`${t("Lugar")} ${index + 1}`}
                      className={panelInputClass}
                      value={place.name}
                      maxLength={80}
                      placeholder={"Soda La Bahía"}
                      onChange={(event) =>
                        set(
                          "recommendations",
                          rows.map((r, i) =>
                            i === index
                              ? { ...r, name: event.target.value }
                              : r,
                          ),
                        )
                      }
                    />
                    {rows.length > 1 ? (
                      <button
                        type="button"
                        aria-label={`${t("Quitar lugar")} ${index + 1}`}
                        className={panelSecondaryButtonClass}
                        onClick={() =>
                          set(
                            "recommendations",
                            rows.filter((_, i) => i !== index),
                          )
                        }
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>
                  <input
                    aria-label={`${t("Por qué lo recomiendas")} ${index + 1}`}
                    className={panelInputClass}
                    value={place.description}
                    maxLength={300}
                    placeholder={t("Por qué lo recomiendas (opcional)")}
                    onChange={(event) =>
                      set(
                        "recommendations",
                        rows.map((r, i) =>
                          i === index
                            ? { ...r, description: event.target.value }
                            : r,
                        ),
                      )
                    }
                  />
                </div>
              ))}
              {values.recommendations.length < 12 ? (
                <button
                  type="button"
                  className="text-teal-deep text-sm font-semibold"
                  onClick={() =>
                    set("recommendations", [
                      ...(values.recommendations.length
                        ? values.recommendations
                        : [{ name: "", description: "" }]),
                      { name: "", description: "" },
                    ])
                  }
                >
                  {t("+ Agregar lugar")}
                </button>
              ) : null}
            </OptionCard>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="bg-cream flex items-center gap-4 rounded-2xl p-4">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt=""
                  className="size-16 rounded-xl object-cover"
                />
              ) : null}
              <div className="min-w-0">
                <p className="text-lg font-semibold">{values.name}</p>
                <p className="text-ink-soft text-sm">
                  {t("Guía en")}{" "}
                  {
                    WIZARD_LANGUAGES.find((l) => l.value === values.language)
                      ?.label
                  }
                </p>
              </div>
            </div>
            {chosen.length ? (
              <ul className="divide-cream-dark border-cream-dark divide-y rounded-2xl border">
                {chosen.map((section) => (
                  <li
                    key={section}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span className="font-semibold">
                      {t(SECTION_INFO[section].title)}
                    </span>
                    <span className="text-ink-soft truncate">
                      {summaryOf(section, values, t)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-soft text-sm">
                {t(
                  "No marcaste secciones. Puedes agregarlas después en el editor.",
                )}
              </p>
            )}
            <button
              type="button"
              className="text-teal-deep text-sm font-semibold"
              onClick={() => go(1)}
            >
              {t("‹ Cambiar secciones")}
            </button>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {t(error)}
          </p>
        ) : null}
      </div>

      <div className="border-cream-dark border-t px-6 py-4 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          {step === 1 ? (
            <button
              type="button"
              className="text-ink-soft hover:text-ink text-sm font-semibold"
              disabled={busy}
              onClick={() => go(2)}
            >
              {t("Saltar por ahora")}
            </button>
          ) : (
            <span />
          )}
          {last ? (
            <button
              type="button"
              className={panelPrimaryButtonClass}
              disabled={busy}
              onClick={create}
            >
              {creating ? t("Creando…") : t("Crear guía")}
            </button>
          ) : (
            <button
              type="button"
              className={panelPrimaryButtonClass}
              disabled={busy || (step === 0 && !values.name.trim())}
              onClick={() => go(step + 1)}
            >
              {t("Continuar")}
            </button>
          )}
        </div>
        {last ? (
          <p className="text-ink-soft pt-3 text-center text-xs">
            {t("Tu código QR se crea junto con la guía y nunca cambia.")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
