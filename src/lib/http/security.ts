import type { NextConfig } from "next";

type Header = { key: string; value: string };
type RemotePattern = NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
>[number];

const STORAGE_PATH = "/storage/v1/object/public/**";

function supabaseUrl(raw: string | undefined): URL | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function isLocalHost(hostname: string): boolean {
  return hostname === "127.0.0.1" || hostname === "localhost";
}

/**
 * The one Supabase project's public storage the optimizer may fetch. The host
 * is pinned to NEXT_PUBLIC_SUPABASE_URL, never a wildcard, so the optimizer
 * cannot be used as a proxy for another project's files. With no valid URL,
 * no remote host is allowed.
 */
export function storageImageConfig(rawSupabaseUrl: string | undefined): {
  remotePatterns: RemotePattern[];
  dangerouslyAllowLocalIP: boolean;
} {
  const url = supabaseUrl(rawSupabaseUrl);
  if (!url) return { remotePatterns: [], dangerouslyAllowLocalIP: false };
  return {
    remotePatterns: [
      {
        protocol: url.protocol === "https:" ? "https" : "http",
        hostname: url.hostname,
        port: url.port,
        pathname: STORAGE_PATH,
      },
    ],
    dangerouslyAllowLocalIP: isLocalHost(url.hostname),
  };
}

/**
 * Response headers for every route. HSTS only when the public site is HTTPS.
 *
 * script-src keeps 'unsafe-inline' on purpose: nonces would force every page
 * to render dynamically, which breaks the static/cached pages that
 * cacheComponents gives us. So this CSP does not stop injected inline script.
 * It limits framing, <base>, <object>, form targets, and where the page may
 * load images from or connect to. Content stays plain text, never HTML, and
 * that is what keeps script injection out.
 */
export function securityHeaders(env: {
  supabaseUrl?: string;
  siteUrl?: string;
  development?: boolean;
}): Header[] {
  const supabase = supabaseUrl(env.supabaseUrl);
  const connect = ["'self'"];
  const images = ["'self'", "data:", "blob:"];
  if (supabase) {
    connect.push(supabase.origin);
    images.push(supabase.origin);
  }
  // React rebuilds call stacks with eval() in development only.
  const scripts = ["'self'", "'unsafe-inline'"];
  if (env.development) scripts.push("'unsafe-eval'");

  const headers: Header[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        `script-src ${scripts.join(" ")}`,
        "style-src 'self' 'unsafe-inline'",
        `img-src ${images.join(" ")}`,
        "font-src 'self'",
        `connect-src ${connect.join(" ")}`,
        "worker-src 'self' blob:",
        "manifest-src 'self'",
      ].join("; "),
    },
  ];

  if (env.siteUrl?.startsWith("https://")) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains",
    });
  }

  return headers;
}
