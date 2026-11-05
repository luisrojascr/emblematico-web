"use server";

import { z } from "zod";

import { SITE } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.object({ email: z.email().max(200) });

export type LoginState = {
  status: "idle" | "sent" | "error";
  message?: string;
};

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  });
  if (!parsed.success) {
    return { status: "error", message: "Ingresa un correo válido." };
  }

  const supabase = await createClient();
  // shouldCreateUser:false -> only invited accounts can sign in.
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${SITE.url}/auth/callback`,
    },
  });

  if (error && error.status && error.status >= 500) {
    return {
      status: "error",
      message: "No pudimos enviar el enlace. Intenta de nuevo.",
    };
  }

  // Same answer whether or not the account exists (no user enumeration).
  return {
    status: "sent",
    message:
      "Si tu correo tiene una cuenta, te enviamos un enlace para ingresar.",
  };
}
