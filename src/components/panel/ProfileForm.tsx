"use client";

import { useActionState } from "react";

import {
  type ProfileState,
  updateProfile,
} from "@/app/(panel)/panel/configuracion/actions";

import { usePanelI18n } from "@/components/panel/PanelLanguageProvider";
import { panelInputClass, panelPrimaryButtonClass } from "./ui";

export function ProfileForm({ fullName }: { fullName: string }) {
  const { t } = usePanelI18n();
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    { status: "idle" },
  );
  return (
    <form action={action} className="space-y-3">
      <label htmlFor="fullName" className="text-sm font-semibold">
        {t("Nombre")}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="fullName"
          name="fullName"
          defaultValue={fullName}
          maxLength={120}
          autoComplete="name"
          className={panelInputClass}
        />
        <button
          type="submit"
          disabled={pending}
          className={panelPrimaryButtonClass}
        >
          {pending ? t("Guardando...") : t("Guardar")}
        </button>
      </div>
      {state.message ? (
        <p
          role="status"
          className={`text-sm ${state.status === "error" ? "text-red-700" : "text-teal-deep"}`}
        >
          {t(state.message)}
        </p>
      ) : null}
    </form>
  );
}
