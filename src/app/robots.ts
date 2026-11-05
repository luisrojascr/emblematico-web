import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

// Client landing pages (/negocio/*) are intentionally NOT disallowed here:
// crawlers must be able to read each page's own robots meta (noindex by default,
// configurable per business).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/panel", "/admin", "/auth", "/ingresar"],
    },
    sitemap: new URL("/sitemap.xml", SITE.url).toString(),
  };
}
