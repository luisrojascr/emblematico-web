import type { NextConfig } from "next";

import { securityHeaders, storageImageConfig } from "./src/lib/http/security";

const images = storageImageConfig(process.env.NEXT_PUBLIC_SUPABASE_URL);

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Off on purpose: with it on, the first hit to an uncached /negocio/{slug} streams from
  // an App Shell, so unknown slugs return 200 and old QR slugs get a meta-refresh instead
  // of a real 308/404. Off, the first render completes before headers are sent.
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: {
      // One catalog image is 5 MB. The panel can send a logo and a cover
      // together, so the raw multipart body must fit both plus the form JSON.
      bodySizeLimit: "12mb",
    },
    // Panel and admin posts pass through the proxy. Its default 10 MB buffer
    // would cut the body off before the action limit above sees it.
    proxyClientMaxBodySize: "12mb",
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: images.remotePatterns,
    // Local Supabase is a private address. Allow it only when that is the
    // configured project, so hosted deploys do not fetch LAN images.
    dangerouslyAllowLocalIP: images.dangerouslyAllowLocalIP,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
          development: process.env.NODE_ENV !== "production",
        }),
      },
    ];
  },
};

export default nextConfig;
