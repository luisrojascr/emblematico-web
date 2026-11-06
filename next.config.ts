import type { NextConfig } from "next";

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
    remotePatterns: [
      // Hosted Supabase Storage (client logos, product images uploaded from /admin).
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
