"use client";

import { useActionState } from "react";

import { TurnstileWidget } from "@/components/auth/TurnstileWidget";

import { type SignupState, resendConfirmation } from "../actions";

const initialState: SignupState = { status: "idle" };

export function ResendForm() {
  const [state, action, pending] = useActionState(
    resendConfirmation,
    initialState,
  );

  return (
    <form action={action} className="space-y-4">
      <TurnstileWidget resetOn={state} />
      <button
        type="submit"
        disabled={pending}
        className="border-ink/30 hover:border-ink hover:bg-cream-dark w-full rounded-full border bg-white px-4 py-3 font-semibold transition-colors disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Reenviar el correo"}
      </button>
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-sm text-red-700"
              : "text-ink-soft text-sm"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
