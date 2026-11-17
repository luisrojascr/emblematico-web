import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { createPublicClient } from "@/lib/supabase/public";

import { pageTag, slugTag } from "./tags";

const publicPageSchema = z.union([
  z.object({
    found: z.literal(true),
    business_id: z.uuid(),
    name: z.string(),
    slug: z.string(),
    template_key: z.enum(["hospitality", "general"]),
    content: z.unknown(),
    indexable: z.boolean(),
    /** Missing until migration 20261116000011 is applied: the branding note is shown. */
    branding: z.boolean().optional(),
  }),
  z.object({
    redirect_to: z.string(),
    /** Plan pause (migration 20261117000012): must not be cached as a permanent redirect. */
    temporary: z.boolean().optional(),
  }),
  /** Paused by the owner's plan and no other guide of theirs is live to redirect to. */
  z.object({ paused: z.literal(true) }),
]);

export type PublicPageResult =
  | {
      kind: "page";
      businessId: string;
      name: string;
      slug: string;
      templateKey: "hospitality" | "general";
      content: unknown;
      indexable: boolean;
      /** "Página creada con emblemático" footer note (paid plans remove it). */
      branding: boolean;
    }
  | { kind: "redirect"; slug: string; temporary: boolean }
  | { kind: "missing" };

/**
 * Reads a public page through the anon-callable `get_public_page` RPC (the only
 * public read path). Cached until a publish/unpublish/suspend/slug change calls
 * `revalidatePublicPage`, with a safety-net expiry in case an invalidation is missed.
 *
 * Results that depend on ANOTHER guide or on the owner's plan (a plan-paused redirect, or
 * "paused with nowhere to go") are cached for seconds only. Their inputs change without
 * touching this slug's tags: the target guide is archived or unpublished, or the owner
 * upgrades and the guide is no longer paused. Exactly one `cacheLife` call runs per call.
 */
export async function getPublicPage(slug: string): Promise<PublicPageResult> {
  "use cache";
  // Tag by slug first so "missing" and "redirect" results can be invalidated too.
  cacheTag(slugTag(slug));

  const { data, error } = await createPublicClient().rpc("get_public_page", {
    p_slug: slug,
  });
  if (error) throw new Error(`get_public_page failed: ${error.message}`);
  if (data === null) {
    cacheLife("hours");
    return { kind: "missing" };
  }

  const parsed = publicPageSchema.safeParse(data);
  if (!parsed.success)
    throw new Error("get_public_page returned unexpected shape");

  if ("paused" in parsed.data) {
    cacheLife("seconds");
    return { kind: "missing" };
  }
  if ("redirect_to" in parsed.data) {
    const temporary = parsed.data.temporary ?? false;
    // A retired slug redirect only changes with this slug's tags; a pause redirect does not.
    // cacheLife() takes one literal profile per overload, so it cannot take a union.
    if (temporary) cacheLife("seconds");
    else cacheLife("hours");
    return {
      kind: "redirect",
      slug: parsed.data.redirect_to,
      temporary,
    };
  }
  cacheLife("hours");
  cacheTag(pageTag(parsed.data.business_id));
  return {
    kind: "page",
    businessId: parsed.data.business_id,
    name: parsed.data.name,
    slug: parsed.data.slug,
    templateKey: parsed.data.template_key,
    content: parsed.data.content,
    indexable: parsed.data.indexable,
    branding: parsed.data.branding ?? true,
  };
}
