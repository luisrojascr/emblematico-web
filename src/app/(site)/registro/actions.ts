"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  CAPTCHA_MESSAGE,
  captchaMissing,
  captchaTokenOf,
  isCaptchaError,
} from "@/lib/auth/captcha";
import { isDisposableEmail } from "@/lib/auth/disposable-domains";
import {
  normalizeEmailInput,
  PASSWORD_RULE_MESSAGE,
  PENDING_EMAIL_COOKIE,
  signupIssueMessage,
  signupSchema,
} from "@/lib/auth/signup";
import { SIGNUP_OPEN, SITE } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export type SignupState = {
  status: "idle" | "sent" | "error";
  message?: string;
};

const CONFIRM_URL = `${SITE.url}/auth/confirm`;

export async function signUp(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  // The page hides the form while signup is closed; this also stops direct posts.
  if (!SIGNUP_OPEN) {
    return { status: "error", message: "El registro abre muy pronto." };
  }
  // Honeypot: real users never see or fill this field. Answer like a success.
  if (String(formData.get("website") ?? "") !== "") {
    redirect("/registro/verifica");
  }

  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: normalizeEmailInput(formData.get("email")),
    password: String(formData.get("password") ?? ""),
    country: String(formData.get("country") ?? ""),
    acceptTerms: formData.get("terms") === "on",
  });
  if (!parsed.success) {
    return { status: "error", message: signupIssueMessage(parsed.error) };
  }
  const { fullName, email, password, country } = parsed.data;

  if (isDisposableEmail(email)) {
    return {
      status: "error",
      message: "Usa un correo permanente, no uno temporal.",
    };
  }
  if (captchaMissing(formData)) {
    return { status: "error", message: CAPTCHA_MESSAGE };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, country },
      emailRedirectTo: CONFIRM_URL,
      captchaToken: captchaTokenOf(formData),
    },
  });

  if (error) {
    if (isCaptchaError(error)) {
      return { status: "error", message: CAPTCHA_MESSAGE };
    }
    if (error.code === "weak_password") {
      return { status: "error", message: PASSWORD_RULE_MESSAGE };
    }
    if (error.status === 429) {
      return {
        status: "error",
        message:
          "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
      };
    }
    console.error("signUp failed", error.code ?? error.status, error.message);
    // Covers a server error and the database refusing a second self-service
    // account for the same person. Neither is explained to the visitor.
    return {
      status: "error",
      message:
        "No pudimos crear tu cuenta. Si ya te registraste con este correo, ingresa. Si no, inténtalo de nuevo.",
    };
  }

  // With email confirmation on, Supabase answers the same way for a new and an
  // existing address, so this page never reveals which emails have an account.
  (await cookies()).set(PENDING_EMAIL_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60,
    path: "/registro",
  });
  redirect("/registro/verifica");
}

export async function resendConfirmation(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const email = (await cookies()).get(PENDING_EMAIL_COOKIE)?.value;
  if (!email) {
    return {
      status: "error",
      message: "Tu sesión de registro venció. Vuelve a registrarte.",
    };
  }
  if (captchaMissing(formData)) {
    return { status: "error", message: CAPTCHA_MESSAGE };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: CONFIRM_URL,
      captchaToken: captchaTokenOf(formData),
    },
  });

  if (error) {
    if (isCaptchaError(error)) {
      return { status: "error", message: CAPTCHA_MESSAGE };
    }
    if (error.status === 429) {
      return {
        status: "error",
        message: "Ya enviamos un correo hace poco. Espera un minuto.",
      };
    }
    console.error("resend failed", error.code ?? error.status, error.message);
    return {
      status: "error",
      message: "No pudimos reenviar el correo. Inténtalo de nuevo.",
    };
  }

  return {
    status: "sent",
    message: "Listo, te enviamos un correo nuevo. Revisa también el spam.",
  };
}
