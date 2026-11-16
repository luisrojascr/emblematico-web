"use client";

import { useActionState } from "react";

import {
  type PasswordState,
  updatePassword,
} from "@/app/(panel)/panel/contrasena/actions";

import { usePanelI18n } from "@/components/panel/PanelLanguageProvider";
import { panelInputClass, panelPrimaryButtonClass } from "./ui";

export function PasswordForm() {
  const { t } = usePanelI18n();
  const [state, action, pending] = useActionState<PasswordState, FormData>(
    updatePassword,
    {},
  );
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-semibold">
          {t("Contraseña nueva")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          className={panelInputClass}
        />
        <p className="text-ink-soft text-xs">{t("Al menos 8 caracteres.")}</p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirm" className="text-sm font-semibold">
          {t("Repite la contraseña")}
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className={panelInputClass}
        />
      </div>
      {state.message ? (
        <p role="alert" className="text-sm text-red-700">
          {t(state.message)}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={panelPrimaryButtonClass}
      >
        {pending ? t("Guardando...") : t("Guardar contraseña")}
      </button>
    </form>
  );
}
