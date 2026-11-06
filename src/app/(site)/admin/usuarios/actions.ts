"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertAdmin } from "@/lib/admin/guard";
import {
  assignMemberSchema,
  inviteSchema,
  removeMemberSchema,
  zodFieldErrors,
  type ActionState,
} from "@/lib/admin/schemas";
import { SITE } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function fail(
  message: string,
  fieldErrors?: Record<string, string>,
): ActionState {
  return { status: "error", message, fieldErrors };
}

function adminReturnPath(value: string, businessId: string | null): string {
  if (value === "/admin/usuarios") return value;
  if (businessId && value === `/admin/negocios/${businessId}`) return value;
  return "/admin/usuarios";
}

export async function inviteClient(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();
  const parsed = inviteSchema.safeParse({
    email: text(formData, "email").trim().toLowerCase(),
    fullName: text(formData, "fullName"),
  });
  if (!parsed.success) {
    return fail(
      "Revisa los campos marcados.",
      zodFieldErrors(parsed.error, ["email", "fullName"]),
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: parsed.data.fullName
        ? { full_name: parsed.data.fullName }
        : undefined,
      redirectTo: `${SITE.url}/auth/callback`,
    },
  );

  if (error || !data.user) {
    const message = error?.message.toLowerCase() ?? "";
    if (message.includes("already") || error?.status === 422) {
      return fail(
        "Esa persona ya tiene cuenta. Asígnale un negocio en la lista.",
      );
    }
    console.error("invite failed", error?.status, error?.message);
    return fail("No pudimos enviar la invitación.");
  }

  if (parsed.data.fullName) {
    await admin
      .from("profiles")
      .update({ full_name: parsed.data.fullName })
      .eq("id", data.user.id);
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?aviso=invitada");
}

export async function assignMember(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const parsed = assignMemberSchema.safeParse({
    businessId: text(formData, "businessId"),
    userId: text(formData, "userId"),
    role: text(formData, "role"),
  });
  if (!parsed.success) {
    return fail(
      "Elige la persona, el negocio y el rol.",
      zodFieldErrors(parsed.error, ["businessId", "userId", "role"]),
    );
  }

  const { error } = await supabase.from("business_members").insert({
    business_id: parsed.data.businessId,
    user_id: parsed.data.userId,
    role: parsed.data.role,
  });
  if (error) {
    if (error.code === "23505")
      return fail("Esa persona ya tiene acceso a ese negocio.");
    console.error("assign member failed", error.code, error.message);
    return fail("No pudimos asignar el acceso.");
  }

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/negocios/${parsed.data.businessId}`);
  redirect(`/admin/negocios/${parsed.data.businessId}?aviso=acceso`);
}

export async function removeMember(formData: FormData): Promise<void> {
  const { supabase } = await assertAdmin();
  const parsed = removeMemberSchema.safeParse({
    businessId: text(formData, "businessId"),
    userId: text(formData, "userId"),
  });
  const next = adminReturnPath(
    text(formData, "returnTo"),
    parsed.success ? parsed.data.businessId : null,
  );
  if (!parsed.success) redirect(`${next}?aviso=error`);

  const { error } = await supabase
    .from("business_members")
    .delete()
    .eq("business_id", parsed.data.businessId)
    .eq("user_id", parsed.data.userId);
  if (error) {
    console.error("remove member failed", error.code, error.message);
    redirect(`${next}?aviso=error`);
  }
  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/negocios/${parsed.data.businessId}`);
  redirect(`${next}?aviso=acceso`);
}
