"use client";

import { useFormStatus } from "react-dom";

import { primaryButtonClass, secondaryButtonClass } from "./ui";

export function SubmitButton({
  children,
  variant = "primary",
}: {
  children: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        variant === "primary" ? primaryButtonClass : secondaryButtonClass
      }
    >
      {pending ? "Procesando..." : children}
    </button>
  );
}
