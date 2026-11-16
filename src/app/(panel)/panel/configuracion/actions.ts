"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { status: "idle" | "ok" | "error"; message?: string };

const schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Escribe tu nombre.")
    .max(120, "Máximo 120 caracteres."),
});

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();
  const parsed = schema.safeParse({ fullName: formData.get("fullName") ?? "" });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);
  if (error) {
    console.error("profile update failed", error.code, error.message);
    return { status: "error", message: "No pudimos guardar tu nombre." };
  }
  revalidatePath("/panel", "layout");
  return { status: "ok", message: "Nombre guardado." };
}
