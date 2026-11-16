"use client";

import { useActionState, useState } from "react";

import {
  type LoginState,
  sendMagicLink,
  sendPasswordReset,
  signInWithPassword,
} from "./actions";

const initialState: LoginState = { status: "idle" };

type Mode = "password" | "reset" | "link";

const inputClass =
  "border-cream-dark w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-teal-deep focus:ring-2 focus:ring-aqua/40";
const primaryClass =
  "bg-sand text-ink hover:bg-sand-hover w-full rounded-full px-4 py-3 font-semibold transition-colors disabled:opacity-60";
const linkClass = "text-teal-deep text-sm font-semibold underline";

function Status({ state }: { state: LoginState }) {
  if (!state.message) return null;
  return (
    <p
      role="status"
      className={
        state.status === "error" ? "text-sm text-red-700" : "text-ink-soft text-sm"
      }
    >
      {state.message}
    </p>
  );
}

function EmailField({ autoFocus }: { autoFocus?: boolean }) {
  return (
    <div className="space-y-1">
      <label htmlFor="email" className="text-sm font-semibold">
        Correo electrónico
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        autoFocus={autoFocus}
        className={inputClass}
      />
    </div>
  );
}

function PasswordLogin({ onMode }: { onMode: (mode: Mode) => void }) {
  const [state, action, pending] = useActionState(
    signInWithPassword,
    initialState,
  );
  return (
    <form action={action} className="space-y-4">
      <EmailField />
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="password" className="text-sm font-semibold">
            Contraseña
          </label>
          <button type="button" className={linkClass} onClick={() => onMode("reset")}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      <button type="submit" disabled={pending} className={primaryClass}>
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
      <Status state={state} />
      <p className="text-ink-soft text-center text-sm">
        ¿Prefieres no usar contraseña?{" "}
        <button type="button" className={linkClass} onClick={() => onMode("link")}>
          Entrar con un enlace por correo
        </button>
      </p>
    </form>
  );
}

function EmailOnly({
  mode,
  onMode,
}: {
  mode: "reset" | "link";
  onMode: (mode: Mode) => void;
}) {
  const [state, action, pending] = useActionState(
    mode === "reset" ? sendPasswordReset : sendMagicLink,
    initialState,
  );
  return (
    <form action={action} className="space-y-4">
      <p className="text-ink-soft text-sm">
        {mode === "reset"
          ? "Te enviamos un enlace para crear una contraseña nueva."
          : "Te enviamos un enlace seguro para entrar sin contraseña."}
      </p>
      <EmailField autoFocus />
      <button type="submit" disabled={pending} className={primaryClass}>
        {pending
          ? "Enviando..."
          : mode === "reset"
            ? "Enviar enlace para restablecer"
            : "Enviar enlace de acceso"}
      </button>
      <Status state={state} />
      <p className="text-center">
        <button type="button" className={linkClass} onClick={() => onMode("password")}>
          Volver a ingresar con contraseña
        </button>
      </p>
    </form>
  );
}

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("password");
  return mode === "password" ? (
    <PasswordLogin onMode={setMode} />
  ) : (
    <EmailOnly key={mode} mode={mode} onMode={setMode} />
  );
}
