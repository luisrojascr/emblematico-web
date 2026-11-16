"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { SITE } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.object({ email: z.email().max(200) });
const passwordLoginSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(72),
});

export type LoginState = {
  status: "idle" | "sent" | "error";
  message?: string;
};

function emailOf(formData: FormData): string {
  return String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
}

export async function signInWithPassword(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = passwordLoginSchema.safeParse({
    email: emailOf(formData),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: "Ingresa tu correo y tu contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    if (error?.status === 429) {
      return {
        status: "error",
        message: "Demasiados intentos. Espera unos minutos.",
      };
    }
    if (error?.status && error.status >= 500) {
      return {
        status: "error",
        message: "No pudimos iniciar sesión. Intenta de nuevo.",
      };
    }
    // Mismo mensaje exista o no la cuenta (no revela qué correos existen).
    return { status: "error", message: "Correo o contraseña incorrectos." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  redirect(profile?.role === "admin" ? "/admin" : "/panel");
}

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse({ email: emailOf(formData) });
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

export async function sendPasswordReset(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse({ email: emailOf(formData) });
  if (!parsed.success) {
    return { status: "error", message: "Ingresa un correo válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${SITE.url}/auth/callback?next=/panel/contrasena` },
  );
  if (error?.status === 429) {
    return {
      status: "error",
      message: "Ya enviamos un correo hace poco. Espera unos minutos.",
    };
  }
  if (error && error.status && error.status >= 500) {
    return {
      status: "error",
      message: "No pudimos enviar el correo. Intenta de nuevo.",
    };
  }

  return {
    status: "sent",
    message:
      "Si tu correo tiene una cuenta, te enviamos un enlace para crear una contraseña nueva.",
  };
}
