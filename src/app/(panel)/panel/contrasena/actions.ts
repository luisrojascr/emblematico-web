"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type PasswordState = { message?: string };

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Usa al menos 8 caracteres.")
      .max(72, "Usa como máximo 72 caracteres."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Las contraseñas no coinciden.",
  });

export async function updatePassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const user = await requireUser();
  const parsed = schema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    if (error.code === "same_password") {
      return { message: "Esa ya es tu contraseña. Elige una distinta." };
    }
    if (error.code === "weak_password") {
      return {
        message:
          "Esa contraseña es muy débil o aparece en filtraciones. Prueba otra.",
      };
    }
    if (error.code === "reauthentication_needed") {
      return {
        message:
          "Por seguridad, cierra sesión y usa “¿Olvidaste tu contraseña?” para cambiarla.",
      };
    }
    console.error("password update failed", error.code, error.status);
    return { message: "No pudimos guardar la contraseña. Intenta de nuevo." };
  }

  redirect(user.role === "admin" ? "/admin" : "/panel?aviso=contrasena");
}
