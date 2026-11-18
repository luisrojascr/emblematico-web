"use client";

import { useActionState } from "react";

import { suspendAccount } from "@/app/(site)/admin/usuarios/[id]/actions";
import { idleState } from "@/lib/admin/schemas";

import { SubmitButton } from "./SubmitButton";
import { FieldError, inputClass } from "./ui";

/** Misuse or apparent scam: blocks the login and suspends the account's guides. */
export function SuspendAccountForm({ userId }: { userId: string }) {
  const [state, action] = useActionState(suspendAccount, idleState);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="userId" value={userId} />
      {state.message ? (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
      <div className="space-y-1">
        <label htmlFor="reason" className="text-sm font-medium">
          Motivo
        </label>
        <textarea
          id="reason"
          name="reason"
          required
          minLength={5}
          maxLength={400}
          rows={2}
          placeholder="Ej.: guía con datos de pago falsos, reportada por huéspedes"
          className={inputClass}
        />
        <FieldError id="reason-error" message={state.fieldErrors?.reason} />
      </div>
      <SubmitButton>Suspender cuenta</SubmitButton>
    </form>
  );
}
