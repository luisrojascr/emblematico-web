import "server-only";

import type { ProductMap } from "./membership";

/** The paid plan sold through Whop checkout (Plus was retired on Nov 26 2026). */
export type CheckoutPlan = "essential";
export type CheckoutBilling = "monthly" | "annual";

/**
 * Whop settings, all server-only. Sandbox and production share nothing (keys,
 * products, webhooks), so every value changes when WHOP_ENVIRONMENT changes.
 */
export type WhopConfig = {
  /** Null when WHOP_ENVIRONMENT is missing or invalid: the webhook stays off. */
  apiBase: string | null;
  apiKey: string | null;
  webhookSecret: string | null;
  products: ProductMap;
  /** The price (`plan_...`) each panel button sells; null when not set. */
  checkoutVariants: Record<
    CheckoutPlan,
    Record<CheckoutBilling, string | null>
  >;
};

const API_BASES = {
  sandbox: "https://sandbox-api.whop.com/api/v1",
  production: "https://api.whop.com/api/v1",
} as const;

const VARIANT_ID_RE = /^plan_[A-Za-z0-9]+$/;

function variantId(value: string | undefined): string | null {
  const id = value?.trim();
  return id && VARIANT_ID_RE.test(id) ? id : null;
}

/** Exact prices we sell, as a comma-separated list of `plan_...` ids. */
function variantIds(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => VARIANT_ID_RE.test(id));
}

export function whopConfig(): WhopConfig {
  // No default: a production deploy that forgot this must not talk to the sandbox
  // with a production key (or the other way around).
  const env = process.env.WHOP_ENVIRONMENT;
  const checkoutVariants = {
    essential: {
      monthly: variantId(process.env.WHOP_PLAN_ESSENTIAL_MONTHLY),
      annual: variantId(process.env.WHOP_PLAN_ESSENTIAL_ANNUAL),
    },
  };
  // Every price the panel sells unlocks its plan; WHOP_PLAN_IDS can add others
  // (for example an older price that existing members still renew on).
  const sold = Object.values(checkoutVariants).flatMap((byPeriod) =>
    Object.values(byPeriod).filter((id): id is string => id !== null),
  );
  return {
    apiBase: env === "production" || env === "sandbox" ? API_BASES[env] : null,
    apiKey: process.env.WHOP_API_KEY || null,
    webhookSecret: process.env.WHOP_WEBHOOK_SECRET || null,
    products: {
      essential: process.env.WHOP_PRODUCT_ESSENTIAL || null,
      // Optional: only for memberships bought before Plus was retired.
      plus: process.env.WHOP_PRODUCT_PLUS || null,
      variants: new Set([...variantIds(process.env.WHOP_PLAN_IDS), ...sold]),
    },
    checkoutVariants,
  };
}

/**
 * Online payment is all or nothing: the API, the webhook (without it a payment would
 * never unlock the plan), the Essential product and both its prices must be set.
 * Otherwise the panel keeps the "we contact you" buttons.
 */
export function onlinePaymentsEnabled(config: WhopConfig): boolean {
  const { essential } = config.checkoutVariants;
  return Boolean(
    config.apiBase &&
    config.apiKey &&
    config.webhookSecret &&
    config.products.essential &&
    essential.monthly &&
    essential.annual,
  );
}
