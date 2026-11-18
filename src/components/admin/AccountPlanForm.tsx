"use client";

import { useActionState, useState } from "react";

import { setAccountPlan } from "@/app/(site)/admin/usuarios/[id]/actions";
import {
  dateInputValue,
  defaultPeriodEnd,
  planName,
} from "@/lib/admin/accounts";
import { idleState } from "@/lib/admin/schemas";
import { PLAN_IDS, type PlanId } from "@/lib/plans";

import { SubmitButton } from "./SubmitButton";
import { FieldError, inputClass } from "./ui";

type Period = "monthly" | "annual";

/** Sets a plan paid by hand. The expiry defaults to one year (annual) or one month. */
export function AccountPlanForm({
  userId,
  initial,
}: {
  userId: string;
  initial: {
    plan: PlanId;
    period: Period | null;
    periodEnd: string | null;
    extraProperties: number;
    limitOverride: number | null;
  };
}) {
  const [state, action] = useActionState(setAccountPlan, idleState);
  const errors = state.fieldErrors ?? {};
  const [plan, setPlan] = useState<PlanId>(initial.plan);
  const [period, setPeriod] = useState<Period>(initial.period ?? "annual");
  const [periodEnd, setPeriodEnd] = useState(
    initial.periodEnd
      ? initial.periodEnd.slice(0, 10)
      : dateInputValue(defaultPeriodEnd("annual")),
  );
  const paid = plan !== "free";

  function choosePeriod(next: Period) {
    setPeriod(next);
    setPeriodEnd(dateInputValue(defaultPeriodEnd(next)));
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="userId" value={userId} />
      {state.message ? (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="plan" className="text-sm font-medium">
          Plan
        </label>
        <select
          id="plan"
          name="plan"
          value={plan}
          onChange={(event) => setPlan(event.target.value as PlanId)}
          className={inputClass}
        >
          {PLAN_IDS.map((id) => (
            <option key={id} value={id}>
              {planName(id)}
            </option>
          ))}
        </select>
        <FieldError id="plan-error" message={errors.plan} />
      </div>

      {paid ? (
        <>
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">Periodo pagado</legend>
            <div className="flex gap-4 text-sm">
              {(["annual", "monthly"] as const).map((value) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="period"
                    value={value}
                    checked={period === value}
                    onChange={() => choosePeriod(value)}
                  />
                  {value === "annual" ? "Anual" : "Mensual"}
                </label>
              ))}
            </div>
            <FieldError id="period-error" message={errors.period} />
          </fieldset>

          <div className="space-y-1">
            <label htmlFor="periodEnd" className="text-sm font-medium">
              Vence el
            </label>
            <input
              id="periodEnd"
              name="periodEnd"
              type="date"
              required
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
              className={inputClass}
            />
            <p className="text-ink-soft text-xs">
              Al vencer tiene 7 días de gracia y luego baja sola a Free.
            </p>
            <FieldError id="periodEnd-error" message={errors.periodEnd} />
          </div>

          {plan === "managers" ? (
            <div className="space-y-1">
              <label htmlFor="limitOverride" className="text-sm font-medium">
                Límite de hospedajes
              </label>
              <input
                id="limitOverride"
                name="limitOverride"
                type="number"
                min={1}
                defaultValue={initial.limitOverride ?? ""}
                placeholder="Sin límite"
                className={inputClass}
              />
              <FieldError
                id="limitOverride-error"
                message={errors.limitOverride}
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label htmlFor="extraProperties" className="text-sm font-medium">
                Hospedajes adicionales pagados
              </label>
              <input
                id="extraProperties"
                name="extraProperties"
                type="number"
                min={0}
                defaultValue={initial.extraProperties}
                className={inputClass}
              />
              {plan === "essential" ? (
                <p className="text-ink-soft text-xs">
                  Essential llega a 7 hospedajes en total.
                </p>
              ) : null}
              <FieldError
                id="extraProperties-error"
                message={errors.extraProperties}
              />
            </div>
          )}
        </>
      ) : (
        <p className="text-ink-soft text-sm">
          En Free queda 1 hospedaje activo (el más antiguo); los demás se pausan
          sin borrarse.
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="note" className="text-sm font-medium">
          Nota para el historial (opcional)
        </label>
        <input
          id="note"
          name="note"
          maxLength={300}
          placeholder="Ej.: pagó por SINPE el 18 nov"
          className={inputClass}
        />
        <FieldError id="note-error" message={errors.note} />
      </div>

      <SubmitButton>Guardar plan</SubmitButton>
    </form>
  );
}
