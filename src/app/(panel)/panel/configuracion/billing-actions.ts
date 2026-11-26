"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { SITE } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import {
  createCheckout,
  fetchMembership,
  MEMBERSHIP_ID_RE,
  whopUrl,
} from "@/lib/whop/api";
import { billingMode, returnOrigin, type BillingRow } from "@/lib/whop/billing";
import {
  onlinePaymentsEnabled,
  whopConfig,
  type CheckoutBilling,
  type CheckoutPlan,
} from "@/lib/whop/config";

const SETTINGS = "/panel/configuracion";

async function ownRow(userId: string): Promise<BillingRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "plan, status, provider, provider_subscription_id, current_period_end",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`read subscription: ${error.message}`);
  return data;
}

function parsePlan(value: FormDataEntryValue | null): CheckoutPlan | null {
  return value === "essential" ? value : null;
}

function parseBilling(
  value: FormDataEntryValue | null,
): CheckoutBilling | null {
  return value === "monthly" || value === "annual" ? value : null;
}

/**
 * "Continue with Essential": creates a Whop checkout for the chosen
 * price with this account in its metadata and sends the browser there. The plan is
 * unlocked later by the webhook, never here.
 */
export async function startCheckout(formData: FormData): Promise<void> {
  const user = await requireUser();
  const plan = parsePlan(formData.get("plan"));
  const billing = parseBilling(formData.get("billing"));
  if (!plan || !billing) redirect(`${SETTINGS}?pago=error#planes`);

  const config = whopConfig();
  let target: string;
  try {
    const mode = billingMode(await ownRow(user.id), {
      onlineEnabled: onlinePaymentsEnabled(config),
      isAdmin: user.role === "admin",
    });
    if (mode === "manage") {
      // Already paying through Whop: change the card or resume there instead.
      target = `${SETTINGS}#suscripcion`;
    } else if (mode === "contact") {
      target = `/contacto?plan=${plan}&periodo=${billing === "monthly" ? "mensual" : "anual"}`;
    } else {
      const origin = returnOrigin((await headers()).get("origin"), SITE.url);
      target = await createCheckout(config, {
        variantId: config.checkoutVariants[plan][billing]!,
        userId: user.id,
        redirectUrl: `${origin}${SETTINGS}?pago=ok#suscripcion`,
      });
    }
  } catch (error) {
    console.error(
      "checkout start failed",
      error instanceof Error ? error.message : error,
    );
    target = `${SETTINGS}?pago=error#planes`;
  }
  redirect(target);
}

/**
 * "Manage subscription": opens Whop's page for this membership (card, cancel,
 * resume). The link is read fresh from the API; it is personal to the buyer.
 */
export async function manageSubscription(): Promise<void> {
  const user = await requireUser();
  const config = whopConfig();
  let target = `${SETTINGS}?pago=portal#suscripcion`;
  try {
    const row = await ownRow(user.id);
    const membershipId = row?.provider_subscription_id;
    if (
      row?.provider === "whop" &&
      membershipId &&
      MEMBERSHIP_ID_RE.test(membershipId)
    ) {
      const membership = await fetchMembership(config, membershipId);
      target = whopUrl(membership.manage_url) ?? target;
    }
  } catch (error) {
    console.error(
      "manage link failed",
      error instanceof Error ? error.message : error,
    );
  }
  redirect(target);
}
