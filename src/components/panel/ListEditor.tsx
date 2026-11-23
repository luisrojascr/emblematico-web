"use client";

import { get, useFieldArray, type Path, type UseFormReturn } from "react-hook-form";

import { usePanelI18n } from "@/components/panel/PanelLanguageProvider";
import type { HospitalityContent } from "@/lib/templates/hospitality/schema";

import { AddButton, TextField } from "./fields";

/** Guide sections that hold a list of items. */
export type ListSectionKey =
  | "tours"
  | "wellness"
  | "shopping"
  | "emergency"
  | "minibar"
  | "taxi"
  | "parking"
  | "faq";

export interface ListRow {
  /** Property of the item, e.g. "name". */
  field: string;
  label: string;
  hint?: string;
  multiline?: boolean;
}

/**
 * Editor for a list of items (places, contacts, minibar products, questions).
 * Each item is a small card with the rows described in `rows`.
 */
export function ListEditor({
  form,
  name,
  rows,
  blank,
  max,
  addLabel,
}: {
  form: UseFormReturn<HospitalityContent>;
  name: ListSectionKey;
  rows: readonly ListRow[];
  /** Empty item appended by the add button. */
  blank: Record<string, string>;
  max: number;
  addLabel: string;
}) {
  const { t } = usePanelI18n();
  const array = useFieldArray({ control: form.control, name: `${name}.items` });
  const errors = form.formState.errors;

  return (
    <div className="space-y-3">
      {array.fields.map((item, index) => (
        <div
          key={item.id}
          className="border-cream-dark space-y-2 rounded-xl border p-3"
        >
          {rows.map((row) => {
            const path = `${name}.items.${index}.${row.field}`;
            return (
              <TextField
                key={row.field}
                id={`${name}-${row.field}-${index}`}
                label={t(row.label)}
                hint={row.hint}
                multiline={row.multiline}
                registration={form.register(path as Path<HospitalityContent>)}
                error={get(errors, `${path}.message`) as string | undefined}
              />
            );
          })}
          <button
            type="button"
            className="text-sm text-red-700"
            onClick={() => array.remove(index)}
          >
            {t("Quitar")}
          </button>
        </div>
      ))}
      <AddButton
        disabled={array.fields.length >= max}
        onClick={() => array.append(blank as never)}
      >
        {addLabel}
      </AddButton>
    </div>
  );
}
