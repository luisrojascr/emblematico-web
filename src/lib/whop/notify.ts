import "server-only";

import { emailConfigured, sendEmail } from "@/lib/email/send";
import { SITE } from "@/lib/site";
import { daysUntil, noticeEmail } from "@/lib/subscriptions/notices";
import type { createAdminClient } from "@/lib/supabase/admin";

import type { PlanTier } from "./membership";

type Admin = ReturnType<typeof createAdminClient>;

const KIND = "paid_canceled";

/**
 * Spanish "your plan won't renew" email for a cancellation scheduled in Whop's
 * portal (Whop's own email is in English and reads as if access ended already).
 * Claimed in subscription_notices first, like the daily job's reminders, so Whop
 * redeliveries or a cancel/resume/cancel in the same period send it once. Failures
 * are logged, never thrown: the subscription is already saved.
 */
export async function sendCancellationNotice(
  supabase: Admin,
  input: { userId: string; plan: PlanTier; periodEnd: Date },
): Promise<void> {
  if (!emailConfigured() || input.plan === "free") return;
  const periodEnd = input.periodEnd.toISOString();
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name, role")
      .eq("id", input.userId)
      .maybeSingle();
    if (profileError) throw new Error(`profile: ${profileError.message}`);
    if (!profile?.email || profile.role === "admin") return;

    const { error: claimError } = await supabase
      .from("subscription_notices")
      .insert({ user_id: input.userId, kind: KIND, period_end: periodEnd });
    if (claimError) {
      if (claimError.code === "23505") return;
      throw new Error(`claim: ${claimError.message}`);
    }

    const email = noticeEmail(KIND, {
      name: profile.full_name,
      plan: input.plan,
      periodEnd: input.periodEnd,
      daysLeft: daysUntil(input.periodEnd, new Date()),
      siteUrl: SITE.url,
      selfServe: true,
    });
    if (!(await sendEmail({ to: profile.email, ...email }))) {
      // Release the claim so a later event for this membership can try again.
      await supabase
        .from("subscription_notices")
        .delete()
        .eq("user_id", input.userId)
        .eq("kind", KIND)
        .eq("period_end", periodEnd);
    }
  } catch (error) {
    console.error(
      "cancellation notice failed",
      error instanceof Error ? error.message : error,
    );
  }
}
