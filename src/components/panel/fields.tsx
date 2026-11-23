"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { UseFormRegisterReturn } from "react-hook-form";

import { usePanelI18n } from "@/components/panel/PanelLanguageProvider";
import { mediaUrl } from "@/lib/catalog/media";
import {
  FieldError,
  inputClass,
  secondaryButtonClass,
} from "@/components/admin/ui";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ImageSlot = {
  file: File | null;
  remove: boolean;
  error: string | null;
  dirty: boolean;
  choose: (file: File | null) => void;
  setRemove: (remove: boolean) => void;
};

export function useImageSlot(): ImageSlot {
  const [file, setFile] = useState<File | null>(null);
  const [remove, setRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choose(next: File | null) {
    if (!next || next.size === 0) {
      setFile(null);
      setError(null);
      return;
    }
    if (next.size > MAX_BYTES || (next.type !== "" && !TYPES.has(next.type))) {
      setFile(null);
      setError("La imagen debe ser JPG, PNG o WebP, de hasta 5 MB.");
      return;
    }
    setFile(next);
    setRemove(false);
    setError(null);
  }

  return {
    file,
    remove,
    error,
    dirty: file !== null || remove,
    choose,
    setRemove,
  };
}

/** Preset accent colors: brand-friendly tones that stay readable on a cover. */
const ACCENT_SWATCHES = [
  { value: "#2E7D6B", label: "Verde" },
  { value: "#4F7F83", label: "Verde azulado" },
  { value: "#C9AC87", label: "Arena" },
  { value: "#D4A862", label: "Dorado" },
  { value: "#C2410C", label: "Terracota" },
  { value: "#1D4ED8", label: "Azul" },
  { value: "#7C3AED", label: "Violeta" },
  { value: "#BE185D", label: "Rosa" },
] as const;

export function AccentField({
  value,
  error,
  onPick,
}: {
  value: string;
  error?: string;
  onPick: (value: string) => void;
}) {
  const { t } = usePanelI18n();
  const current = /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : "";
  const custom =
    current && !ACCENT_SWATCHES.some((swatch) => swatch.value === current);
  return (
    <div className="space-y-2">
      <p id="accent-label" className="text-sm font-medium">
        {t("Color de acento")}
      </p>
      <div
        role="radiogroup"
        aria-labelledby="accent-label"
        className="flex flex-wrap items-center gap-3"
      >
        {ACCENT_SWATCHES.map((swatch) => {
          const selected = current === swatch.value;
          return (
            <button
              key={swatch.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={t(swatch.label)}
              title={t(swatch.label)}
              onClick={() => onPick(swatch.value)}
              style={{ backgroundColor: swatch.value }}
              className={`size-10 rounded-full border-2 border-white shadow-sm ring-1 ring-ink/20 transition-shadow ${
                selected ? "ring-ink ring-2" : ""
              }`}
            />
          );
        })}
        <label
          title={t("Otro color")}
          className={`relative flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-white text-xs font-bold shadow-sm ring-1 ring-ink/20 has-[:focus-visible]:ring-2 ${
            custom ? "ring-ink ring-2" : "bg-white"
          }`}
          style={custom ? { backgroundColor: current } : undefined}
        >
          <span aria-hidden="true" className={custom ? "sr-only" : ""}>
            +
          </span>
          <input
            type="color"
            aria-label={t("Elegir otro color")}
            value={current || "#C9AC87"}
            onChange={(event) => onPick(event.target.value.toUpperCase())}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </div>
      <p className="text-ink-soft text-xs">
        {t("Se usa en la portada y en los botones de tu guía.")}
      </p>
      <FieldError id="accent-error" message={error ? t(error) : undefined} />
    </div>
  );
}

export function TextField({
  id,
  label,
  registration,
  error,
  multiline,
  hint,
}: {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  multiline?: boolean;
  hint?: string;
}) {
  const { t } = usePanelI18n();
  const describedBy = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {t(label)}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={4}
          className={inputClass}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...registration}
        />
      ) : (
        <input
          id={id}
          className={inputClass}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...registration}
        />
      )}
      {hint ? <p className="text-ink-soft text-xs">{t(hint)}</p> : null}
      <FieldError id={`${id}-error`} message={error ? t(error) : undefined} />
    </div>
  );
}

export function Section({
  title,
  enabled,
  children,
}: {
  title: string;
  enabled: ReactNode;
  children: ReactNode;
}) {
  const { t } = usePanelI18n();
  return (
    <fieldset className="border-cream-dark space-y-3 rounded-xl border bg-white p-4">
      <legend className="px-1 text-base font-medium">{t(title)}</legend>
      <label className="flex items-center gap-2 text-sm">
        {enabled}
        {t("Mostrar esta sección")}
      </label>
      {children}
    </fieldset>
  );
}

export function ImageField({
  id,
  label,
  currentPath,
  slot,
}: {
  id: string;
  label: string;
  currentPath?: string | null;
  slot: ImageSlot;
}) {
  const { t } = usePanelI18n();
  // Local preview of a newly chosen file; revoked when it changes or unmounts.
  const localUrl = useMemo(
    () => (slot.file ? URL.createObjectURL(slot.file) : null),
    [slot.file],
  );
  useEffect(
    () => () => {
      if (localUrl) URL.revokeObjectURL(localUrl);
    },
    [localUrl],
  );
  const savedUrl =
    currentPath && !slot.remove && !slot.file ? mediaUrl(currentPath) : null;
  const thumb = localUrl ?? savedUrl;
  const hasImage = Boolean(thumb);
  const buttonClass =
    "border-ink/25 text-ink hover:border-ink hover:bg-ink/5 inline-flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2";
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t(label)}</p>
      <div className="border-cream-dark flex items-center gap-3 rounded-2xl border bg-white p-3">
        <div className="bg-cream-dark/60 text-teal/60 flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl">
          {thumb ? (
            // Plain img: avoids next/image remote patterns for a small thumbnail.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="size-full object-cover" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="16" rx="2.5" />
              <circle cx="9" cy="10" r="1.8" />
              <path d="m21 16-5-5-8 8" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-ink-soft truncate text-sm">
            {slot.file
              ? slot.file.name
              : slot.remove
                ? t("Se quitará al guardar.")
                : hasImage
                  ? t("Foto actual")
                  : t("Sin foto")}
          </p>
          <div className="flex flex-wrap gap-2">
            <label className={buttonClass}>
              {hasImage ? t("Cambiar") : t("Subir foto")}
              <input
                id={id}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onClick={(event) => {
                  // Lets the same file be picked twice in a row.
                  event.currentTarget.value = "";
                }}
                onChange={(event) => {
                  slot.choose(event.target.files?.[0] ?? null);
                }}
              />
            </label>
            {slot.remove ? (
              <button
                type="button"
                className={buttonClass}
                onClick={() => slot.setRemove(false)}
              >
                {t("Deshacer")}
              </button>
            ) : hasImage ? (
              <button
                type="button"
                className={`${buttonClass} text-red-700`}
                onClick={() => {
                  if (slot.file) slot.choose(null);
                  else slot.setRemove(true);
                }}
              >
                {t("Quitar")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <FieldError
        id={`${id}-error`}
        message={slot.error ? t(slot.error) : undefined}
      />
    </div>
  );
}

export function AddButton({
  children,
  onClick,
  disabled,
}: {
  children: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const { t } = usePanelI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={secondaryButtonClass}
    >
      {t(children)}
    </button>
  );
}
