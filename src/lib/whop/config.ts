import "server-only";

import type { ProductMap } from "./membership";

/**
 * Whop settings, all server-only. Sandbox and production share nothing (keys,
 * products, webhooks), so every value changes when WHOP_ENVIRONMENT changes.
 */
export type WhopConfig = {
  apiBase: string;
  apiKey: string | null;
  webhookSecret: string | null;
  products: ProductMap;
};

const API_BASES = {
  sandbox: "https://sandbox-api.whop.com/api/v1",
  production: "https://api.whop.com/api/v1",
} as const;

export function whopConfig(): WhopConfig {
  const env = process.env.WHOP_ENVIRONMENT === "production" ? "production" : "sandbox";
  return {
    apiBase: API_BASES[env],
    apiKey: process.env.WHOP_API_KEY || null,
    webhookSecret: process.env.WHOP_WEBHOOK_SECRET || null,
    products: {
      essential: process.env.WHOP_PRODUCT_ESSENTIAL || null,
      plus: process.env.WHOP_PRODUCT_PLUS || null,
    },
  };
}
