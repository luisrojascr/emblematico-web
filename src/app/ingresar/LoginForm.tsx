"use client";

import { useActionState } from "react";

import { type LoginState, sendMagicLink } from "./actions";

const initialState: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, action, pending] = useActionState(sendMagicLink, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="border-cream-dark w-full rounded-lg border bg-white px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-cream hover:bg-sand-dark w-full rounded-full px-4 py-2.5 font-medium transition-colors disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar enlace de acceso"}
      </button>
      {state.message ? (
        <p
          role="status"
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
