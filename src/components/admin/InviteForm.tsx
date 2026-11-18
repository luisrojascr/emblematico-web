"use client";

import { useActionState } from "react";

import { inviteClient } from "@/app/(site)/admin/usuarios/actions";
import { planName } from "@/lib/admin/accounts";
import { idleState } from "@/lib/admin/schemas";
import { PLAN_IDS } from "@/lib/plans";

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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="invite-plan" className="text-sm font-medium">
            Plan
          </label>
          <select
            id="invite-plan"
            name="plan"
            defaultValue="free"
            className={inputClass}
          >
            {PLAN_IDS.map((id) => (
              <option key={id} value={id}>
                {planName(id)}
              </option>
            ))}
          </select>
          <FieldError id="invite-plan-error" message={errors.plan} />
        </div>
        <div className="space-y-1">
          <label htmlFor="invite-period" className="text-sm font-medium">
            Periodo pagado
          </label>
          <select
            id="invite-period"
            name="period"
            defaultValue="annual"
            className={inputClass}
          >
            <option value="annual">Anual (vence en 1 año)</option>
            <option value="monthly">Mensual (vence en 1 mes)</option>
          </select>
          <FieldError id="invite-period-error" message={errors.period} />
        </div>
      </div>
      <SubmitButton>Enviar invitación</SubmitButton>
    </form>
  );
}
