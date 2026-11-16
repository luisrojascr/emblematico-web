"use client";

import { useState, type ReactNode } from "react";

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

export function AccentField({
  value,
  registration,
  error,
  onPick,
}: {
  value: string;
  registration: UseFormRegisterReturn;
  error?: string;
  onPick: (value: string) => void;
}) {
  const { t } = usePanelI18n();
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#C9AC87";
  return (
    <div className="flex items-end gap-3">
      <div className="min-w-0 flex-1">
        <TextField
          id="accent"
          label={t("Color de acento")}
          hint={t("Ejemplo: #C9AC87")}
          registration={registration}
          error={error}
        />
      </div>
      <input
        type="color"
        aria-label={t("Elegir color de acento")}
        value={safe}
        onChange={(event) => onPick(event.target.value)}
        className="border-cream-dark mb-1 h-10 w-14 cursor-pointer rounded border bg-white"
      />
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
  const shown = currentPath && !slot.remove && !slot.file;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {t(label)}
      </label>
      {shown ? (
        // The public template uses next/image. A plain image here avoids a
        // remote-pattern miss while the editor only needs a thumbnail.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(currentPath)}
          alt=""
          className="border-cream-dark h-20 w-20 rounded-lg border object-cover"
        />
      ) : null}
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="block text-sm"
        onChange={(event) => {
          slot.choose(event.target.files?.[0] ?? null);
        }}
      />
      {slot.file ? (
        <p className="text-ink-soft text-xs">
          {t("{file} se guardará con el borrador.", { file: slot.file.name })}
        </p>
      ) : null}
      {currentPath ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={slot.remove}
            onChange={(event) => {
              slot.setRemove(event.target.checked);
              if (event.target.checked) slot.choose(null);
            }}
          />
          {t("Quitar imagen")}
        </label>
      ) : null}
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
