"use client";

import { useActionState } from "react";

import { assignMember } from "@/app/(site)/admin/usuarios/actions";
import { MEMBER_ROLES, memberRoleLabel } from "@/lib/admin/labels";
import { idleState } from "@/lib/admin/schemas";

import { SubmitButton } from "./SubmitButton";
import { FieldError, inputClass } from "./ui";

type Option = { id: string; label: string };

export function AssignForm({
  users,
  businesses,
  businessId,
}: {
  users: Option[];
  businesses?: Option[];
  businessId?: string;
}) {
  const [state, action] = useActionState(assignMember, idleState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {state.message && (
        <p role="alert" className="text-sm text-red-700 sm:col-span-2">
          {state.message}
        </p>
      )}
      {businessId ? (
        <input type="hidden" name="businessId" value={businessId} />
      ) : (
        <div className="space-y-1">
          <label htmlFor="businessId" className="text-sm font-medium">
            Negocio
          </label>
          <select
            id="businessId"
            name="businessId"
            required
            className={inputClass}
            defaultValue=""
          >
            <option value="" disabled>
              Elige un negocio
            </option>
            {businesses?.map((business) => (
              <option key={business.id} value={business.id}>
                {business.label}
              </option>
            ))}
          </select>
          <FieldError id="business-error" message={errors.businessId} />
        </div>
      )}
      <div className="space-y-1">
        <label htmlFor="userId" className="text-sm font-medium">
          Persona
        </label>
        <select
          id="userId"
          name="userId"
          required
          className={inputClass}
          defaultValue=""
        >
          <option value="" disabled>
            Elige una persona
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.label}
            </option>
          ))}
        </select>
        <FieldError id="user-error" message={errors.userId} />
      </div>
      <div className="space-y-1">
        <label htmlFor="role" className="text-sm font-medium">
          Rol
        </label>
        <select
          id="role"
          name="role"
          className={inputClass}
          defaultValue="owner"
        >
          {MEMBER_ROLES.map((role) => (
            <option key={role} value={role}>
              {memberRoleLabel(role)}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>Asignar acceso</SubmitButton>
      </div>
    </form>
  );
}
