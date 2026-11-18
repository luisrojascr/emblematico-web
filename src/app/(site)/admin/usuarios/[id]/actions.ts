"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  ACCOUNT_BAN_DURATION,
  ACCOUNT_SUSPENSION_PREFIX,
  accountReasonSchema,
  extendTrialSchema,
  extendedTrialEnd,
  manualSubscription,
  setPlanSchema,
} from "@/lib/admin/accounts";
import { recordPlanEvent } from "@/lib/admin/accounts-data";
import { revalidateBusiness } from "@/lib/admin/cache";
import { assertAdmin, type AdminContext } from "@/lib/admin/guard";
import { zodFieldErrors, type ActionState } from "@/lib/admin/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

const SUB_COLUMNS =
  "plan, status, billing_period, trial_ends_at, current_period_end, extra_properties, property_limit_override";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function optional(formData: FormData, key: string): string | null {
  const value = text(formData, key).trim();
  return value === "" ? null : value;
}

function fail(
  message: string,
  fieldErrors?: Record<string, string>,
): ActionState {
  return { status: "error", message, fieldErrors };
}

const accountPath = (userId: string) => `/admin/usuarios/${userId}`;

/**
 * Plan changes alter what every guide of the account shows (branding, paused
 * redirects), so their cached public pages are refreshed right away.
 */
async function revalidateOwnedGuides(ctx: AdminContext, userId: string) {
  const { data } = await ctx.supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", userId)
    .eq("role", "owner");
  await Promise.all(
    (data ?? []).map((row) =>
      revalidateBusiness(ctx.supabase, row.business_id),
    ),
  );
  revalidatePath("/admin/usuarios");
  revalidatePath(accountPath(userId));
}

async function currentSubscription(ctx: AdminContext, userId: string) {
  const { data } = await ctx.supabase
    .from("subscriptions")
    .select(SUB_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

async function isAdminAccount(ctx: AdminContext, userId: string) {
  const { data } = await ctx.supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role === "admin";
}

/** Sets a plan by hand (payment by SINPE or card), with its expiry date. */
export async function setAccountPlan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await assertAdmin();
  const parsed = setPlanSchema.safeParse({
    userId: text(formData, "userId"),
    plan: text(formData, "plan"),
    period: optional(formData, "period"),
    periodEnd: optional(formData, "periodEnd"),
    extraProperties: optional(formData, "extraProperties") ?? 0,
    limitOverride: optional(formData, "limitOverride"),
    note: text(formData, "note"),
  });
  if (!parsed.success) {
    return fail(
      "Revisa los campos marcados.",
      zodFieldErrors(parsed.error, [
        "plan",
        "period",
        "periodEnd",
        "extraProperties",
        "limitOverride",
        "note",
      ]),
    );
  }
  const input = parsed.data;
  const before = await currentSubscription(ctx, input.userId);
  const after = manualSubscription(input);

  const { error } = await ctx.supabase
    .from("subscriptions")
    .upsert({ user_id: input.userId, ...after }, { onConflict: "user_id" });
  if (error) {
    console.error("set plan failed", error.code, error.message);
    return fail("No pudimos guardar el plan.");
  }
  await recordPlanEvent({
    userId: input.userId,
    adminEmail: ctx.user.email,
    type: "admin.plan_set",
    before,
    after,
    note: input.note || undefined,
  });
  await revalidateOwnedGuides(ctx, input.userId);
  redirect(`${accountPath(input.userId)}?aviso=plan`);
}

/** Adds days to a running trial, or restarts a lapsed one from today. */
export async function extendTrial(formData: FormData): Promise<void> {
  const ctx = await assertAdmin();
  const parsed = extendTrialSchema.safeParse({
    userId: text(formData, "userId"),
    days: text(formData, "days"),
  });
  if (!parsed.success) redirect("/admin/usuarios?aviso=error");
  const { userId, days } = parsed.data;

  const before = await currentSubscription(ctx, userId);
  const paid =
    before &&
    before.status !== "trialing" &&
    before.plan !== "free" &&
    (!before.current_period_end ||
      new Date(before.current_period_end) > new Date());
  if (paid) redirect(`${accountPath(userId)}?aviso=con-plan`);

  const after = {
    plan:
      before?.plan && before.plan !== "free"
        ? before.plan
        : ("essential" as const),
    status: "trialing" as const,
    trial_ends_at: extendedTrialEnd(
      before?.status === "trialing" ? before.trial_ends_at : null,
      days,
    ).toISOString(),
  };
  const { error } = await ctx.supabase
    .from("subscriptions")
    .upsert({ user_id: userId, ...after }, { onConflict: "user_id" });
  if (error) {
    console.error("extend trial failed", error.code, error.message);
    redirect(`${accountPath(userId)}?aviso=error`);
  }
  await recordPlanEvent({
    userId,
    adminEmail: ctx.user.email,
    type: "admin.trial_extended",
    before,
    after,
    note: `+${days} días`,
  });
  await revalidateOwnedGuides(ctx, userId);
  redirect(`${accountPath(userId)}?aviso=prueba`);
}

/**
 * Non-payment: the account drops to Free. Its oldest guide stays live, the rest are
 * paused (their QR codes open the live one) and the panel stays open.
 */
export async function dropToFree(formData: FormData): Promise<void> {
  const ctx = await assertAdmin();
  const parsed = accountReasonSchema.safeParse({
    userId: text(formData, "userId"),
    reason: text(formData, "reason") || "Falta de pago",
  });
  if (!parsed.success) redirect("/admin/usuarios?aviso=error");
  const { userId, reason } = parsed.data;

  const before = await currentSubscription(ctx, userId);
  const after = {
    plan: "free" as const,
    status: "expired" as const,
    billing_period: null,
    current_period_end: null,
    extra_properties: 0,
    property_limit_override: null,
  };
  const { error } = await ctx.supabase
    .from("subscriptions")
    .upsert({ user_id: userId, ...after }, { onConflict: "user_id" });
  if (error) {
    console.error("drop to free failed", error.code, error.message);
    redirect(`${accountPath(userId)}?aviso=error`);
  }
  await recordPlanEvent({
    userId,
    adminEmail: ctx.user.email,
    type: "admin.dropped_to_free",
    before,
    after,
    note: reason,
  });
  await revalidateOwnedGuides(ctx, userId);
  redirect(`${accountPath(userId)}?aviso=free`);
}

/**
 * Misuse (scam, abuse): blocks the login and suspends every guide the account owns.
 * Guides are marked with ACCOUNT_SUSPENSION_PREFIX so reactivation restores only those.
 */
export async function suspendAccount(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await assertAdmin();
  const parsed = accountReasonSchema.safeParse({
    userId: text(formData, "userId"),
    reason: text(formData, "reason"),
  });
  if (!parsed.success) {
    return fail("Escribe el motivo.", zodFieldErrors(parsed.error, ["reason"]));
  }
  const { userId, reason } = parsed.data;
  if (userId === ctx.user.id || (await isAdminAccount(ctx, userId))) {
    return fail("No se puede suspender una cuenta de administración.");
  }

  const admin = createAdminClient();
  const { error: banError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: ACCOUNT_BAN_DURATION,
  });
  if (banError) {
    console.error("ban failed", banError.status, banError.message);
    return fail("No pudimos bloquear el ingreso.");
  }

  const { data: owned } = await ctx.supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", userId)
    .eq("role", "owner");
  const ids = (owned ?? []).map((row) => row.business_id);
  let suspended: string[] = [];
  if (ids.length > 0) {
    const { data, error } = await ctx.supabase
      .from("businesses")
      .update({
        status: "suspended",
        suspended_reason: `${ACCOUNT_SUSPENSION_PREFIX}${reason}`.slice(0, 500),
      })
      .in("id", ids)
      .eq("status", "active")
      .select("id");
    if (error)
      console.error("suspend guides failed", error.code, error.message);
    suspended = (data ?? []).map((row) => row.id);
  }

  await recordPlanEvent({
    userId,
    adminEmail: ctx.user.email,
    type: "admin.account_suspended",
    before: null,
    after: { blocked: true, suspended_guides: suspended },
    note: reason,
  });
  await revalidateOwnedGuides(ctx, userId);
  redirect(`${accountPath(userId)}?aviso=suspendida`);
}

/** Lifts the login block and reactivates the guides suspended with the account. */
export async function reactivateAccount(formData: FormData): Promise<void> {
  const ctx = await assertAdmin();
  const parsed = z.uuid().safeParse(text(formData, "userId"));
  if (!parsed.success) redirect("/admin/usuarios?aviso=error");
  const userId = parsed.data;

  const { error: banError } =
    await createAdminClient().auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });
  if (banError) {
    console.error("unban failed", banError.status, banError.message);
    redirect(`${accountPath(userId)}?aviso=error`);
  }

  const { data: owned } = await ctx.supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", userId)
    .eq("role", "owner");
  const ids = (owned ?? []).map((row) => row.business_id);
  let reactivated: string[] = [];
  if (ids.length > 0) {
    const { data, error } = await ctx.supabase
      .from("businesses")
      .update({ status: "active" })
      .in("id", ids)
      .eq("status", "suspended")
      .like("suspended_reason", `${ACCOUNT_SUSPENSION_PREFIX}%`)
      .select("id");
    if (error)
      console.error("reactivate guides failed", error.code, error.message);
    reactivated = (data ?? []).map((row) => row.id);
  }

  await recordPlanEvent({
    userId,
    adminEmail: ctx.user.email,
    type: "admin.account_reactivated",
    before: { blocked: true },
    after: { blocked: false, reactivated_guides: reactivated },
  });
  await revalidateOwnedGuides(ctx, userId);
  redirect(`${accountPath(userId)}?aviso=reactivada`);
}
