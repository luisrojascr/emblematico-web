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
  }),
  z.object({ redirect_to: z.string() }),
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
    }
  | { kind: "redirect"; slug: string }
  | { kind: "missing" };

/**
 * Reads a public page through the anon-callable `get_public_page` RPC (the only
 * public read path). Cached until a publish/unpublish/suspend/slug change calls
 * `revalidatePublicPage`, with a safety-net expiry in case an invalidation is missed.
 */
export async function getPublicPage(slug: string): Promise<PublicPageResult> {
  "use cache";
  cacheLife("hours");
  // Tag by slug first so "missing" and "redirect" results can be invalidated too.
  cacheTag(slugTag(slug));

  const { data, error } = await createPublicClient().rpc("get_public_page", {
    p_slug: slug,
  });
  if (error) throw new Error(`get_public_page failed: ${error.message}`);
  if (data === null) return { kind: "missing" };

  const parsed = publicPageSchema.safeParse(data);
  if (!parsed.success)
    throw new Error("get_public_page returned unexpected shape");

  if ("redirect_to" in parsed.data) {
    return { kind: "redirect", slug: parsed.data.redirect_to };
  }
  cacheTag(pageTag(parsed.data.business_id));
  return {
    kind: "page",
    businessId: parsed.data.business_id,
    name: parsed.data.name,
    slug: parsed.data.slug,
    templateKey: parsed.data.template_key,
    content: parsed.data.content,
    indexable: parsed.data.indexable,
  };
}
