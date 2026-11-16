"use client";

import { useActionState } from "react";

import {
  type PasswordState,
  updatePassword,
} from "@/app/(panel)/panel/contrasena/actions";

import { panelInputClass, panelPrimaryButtonClass } from "./ui";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(
    updatePassword,
    {},
  );
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-semibold">
          Contraseña nueva
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
        <p className="text-ink-soft text-xs">Al menos 8 caracteres.</p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirm" className="text-sm font-semibold">
          Repite la contraseña
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
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={panelPrimaryButtonClass}>
        {pending ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}
