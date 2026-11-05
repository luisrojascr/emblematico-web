"use client";

import { useActionState } from "react";

import { inviteClient } from "@/app/(site)/admin/usuarios/actions";
import { idleState } from "@/lib/admin/schemas";

import { SubmitButton } from "./SubmitButton";
import { FieldError, inputClass } from "./ui";

export function InviteForm() {
  const [state, action] = useActionState(inviteClient, idleState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4">
      {state.message && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="off"
          className={inputClass}
        />
        <FieldError id="email-error" message={errors.email} />
      </div>
      <div className="space-y-1">
        <label htmlFor="fullName" className="text-sm font-medium">
          Nombre
        </label>
        <input
          id="fullName"
          name="fullName"
          autoComplete="off"
          className={inputClass}
        />
        <FieldError id="name-error" message={errors.fullName} />
      </div>
      <SubmitButton>Enviar invitación</SubmitButton>
    </form>
  );
}
