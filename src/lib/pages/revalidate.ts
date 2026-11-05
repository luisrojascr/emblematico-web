import { revalidateTag } from "next/cache";

import { pageTag, slugTag } from "./tags";

/**
 * Call from server actions after publish, unpublish, suspend/reactivate, archive or
 * a slug change. Pass every slug that may have cached a result: the current slug and
 * any retired ones (a slug change leaves the old one cached as "page" or "missing").
 */
export function revalidatePublicPage(input: {
  businessId: string;
  slugs: readonly string[];
}) {
  revalidateTag(pageTag(input.businessId), { expire: 0 });
  for (const slug of new Set(input.slugs)) {
    revalidateTag(slugTag(slug), { expire: 0 });
  }
}
