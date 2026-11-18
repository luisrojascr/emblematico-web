"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  CAPTCHA_MESSAGE,
  captchaMissing,
  captchaTokenOf,
  isCaptchaError,
} from "@/lib/auth/captcha";
import { SITE } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const ACCOUNT_BLOCKED_MESSAGE =
  "Tu cuenta está suspendida. Si crees que es un error, escríbenos desde la página de contacto.";

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

  if (captchaMissing(formData)) {
    return { status: "error", message: CAPTCHA_MESSAGE };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    ...parsed.data,
    options: { captchaToken: captchaTokenOf(formData) },
  });
  if (error || !data.user) {
    if (isCaptchaError(error)) {
      return { status: "error", message: CAPTCHA_MESSAGE };
    }
    if (error?.code === "user_banned") {
      return { status: "error", message: ACCOUNT_BLOCKED_MESSAGE };
    }
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
    // Same message whether or not the account exists (no user enumeration).
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
  if (captchaMissing(formData)) {
    return { status: "error", message: CAPTCHA_MESSAGE };
  }

  const supabase = await createClient();
  // shouldCreateUser:false -> the magic link never creates an account; signup has its own form.
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${SITE.url}/auth/callback`,
      captchaToken: captchaTokenOf(formData),
    },
  });
  if (isCaptchaError(error)) {
    return { status: "error", message: CAPTCHA_MESSAGE };
  }

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
  if (captchaMissing(formData)) {
    return { status: "error", message: CAPTCHA_MESSAGE };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${SITE.url}/auth/callback?next=/panel/contrasena`,
      captchaToken: captchaTokenOf(formData),
    },
  );
  if (isCaptchaError(error)) {
    return { status: "error", message: CAPTCHA_MESSAGE };
  }
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
