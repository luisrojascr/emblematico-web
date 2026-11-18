"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type ConfirmState = { status: "idle" | "error"; message?: string };

const confirmSchema = z.object({
  token_hash: z.string().min(10).max(300),
  // Confirmation links for new accounts. Password recovery and invitations keep
  // using /auth/callback.
  type: z.enum(["email", "signup", "magiclink"]),
});

/**
 * Confirms the email. This is a button on a page, not a GET handler: mail security
 * scanners open every link in a message, and a GET that consumed the one-time token
 * would leave the real user with an expired link.
 */
export async function confirmEmail(
  _prev: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const parsed = confirmSchema.safeParse({
    token_hash: formData.get("token_hash"),
    type: formData.get("type"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Este enlace no es válido. Revisa el correo o pide uno nuevo.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp(parsed.data);
  if (error) {
    return {
      status: "error",
      message:
        "Este enlace ya no sirve. Si ya confirmaste tu correo, ingresa; si no, pide uno nuevo.",
    };
  }

  redirect("/panel");
}
