"use client";

import Link from "next/link";
import { useActionState } from "react";

import { type ConfirmState, confirmEmail } from "./actions";

const initialState: ConfirmState = { status: "idle" };

export function ConfirmForm({
  tokenHash,
  type,
}: {
  tokenHash: string;
  type: string;
}) {
  const [state, action, pending] = useActionState(confirmEmail, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <button
        type="submit"
        disabled={pending}
        className="bg-sand text-ink hover:bg-sand-hover w-full rounded-full px-4 py-3 font-semibold transition-colors disabled:opacity-60"
      >
        {pending ? "Confirmando..." : "Confirmar mi correo"}
      </button>
      {state.message ? (
        <div role="alert" className="space-y-2 text-sm text-red-700">
          <p>{state.message}</p>
          <p>
            <Link
              href="/ingresar"
              className="text-teal-deep font-semibold underline"
            >
              Ingresar
            </Link>
          </p>
        </div>
      ) : null}
    </form>
  );
}
