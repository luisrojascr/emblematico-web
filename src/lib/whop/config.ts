import "server-only";

import type { ProductMap } from "./membership";

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
};

const API_BASES = {
  sandbox: "https://sandbox-api.whop.com/api/v1",
  production: "https://api.whop.com/api/v1",
} as const;

/** Exact prices we sell, as a comma-separated list of `plan_...` ids. */
function variantIds(value: string | undefined): ReadonlySet<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => /^plan_[A-Za-z0-9]+$/.test(id)),
  );
}

export function whopConfig(): WhopConfig {
  // No default: a production deploy that forgot this must not talk to the sandbox
  // with a production key (or the other way around).
  const env = process.env.WHOP_ENVIRONMENT;
  return {
    apiBase: env === "production" || env === "sandbox" ? API_BASES[env] : null,
    apiKey: process.env.WHOP_API_KEY || null,
    webhookSecret: process.env.WHOP_WEBHOOK_SECRET || null,
    products: {
      essential: process.env.WHOP_PRODUCT_ESSENTIAL || null,
      plus: process.env.WHOP_PRODUCT_PLUS || null,
      variants: variantIds(process.env.WHOP_PLAN_IDS),
    },
  };
}
