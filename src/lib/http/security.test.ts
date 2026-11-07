import { describe, expect, it } from "vitest";

import { securityHeaders, storageImageConfig } from "./security";

function csp(headers: { key: string; value: string }[]): string {
  return (
    headers.find((header) => header.key === "Content-Security-Policy")?.value ??
    ""
  );
}

function directive(policy: string, name: string): string {
  return (
    policy
      .split("; ")
      .find((part) => part.startsWith(`${name} `))
      ?.slice(name.length + 1) ?? ""
  );
}

describe("storageImageConfig", () => {
  it("pins a hosted project to its exact host", () => {
    const images = storageImageConfig("https://abcd.supabase.co");
    expect(images.dangerouslyAllowLocalIP).toBe(false);
    expect(images.remotePatterns).toEqual([
      {
        protocol: "https",
        hostname: "abcd.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ]);
  });

  it("allows only the local Supabase host and port in development", () => {
    const images = storageImageConfig("http://127.0.0.1:54321");
    expect(images.dangerouslyAllowLocalIP).toBe(true);
    expect(images.remotePatterns).toEqual([
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
    ]);
  });

  it("allows no remote host without a valid Supabase URL", () => {
    for (const raw of [undefined, "", "not a url", "ftp://abcd.supabase.co"]) {
      expect(storageImageConfig(raw)).toEqual({
        remotePatterns: [],
        dangerouslyAllowLocalIP: false,
      });
    }
  });
});

describe("securityHeaders", () => {
  it("sets CSP and skips HSTS on a local site", () => {
    const headers = securityHeaders({
      supabaseUrl: "http://127.0.0.1:54321",
      siteUrl: "http://localhost:3000",
    });
    expect(csp(headers)).toContain("default-src 'self'");
    expect(directive(csp(headers), "img-src")).toContain(
      "http://127.0.0.1:54321",
    );
    expect(headers.some((h) => h.key === "Strict-Transport-Security")).toBe(
      false,
    );
    expect(headers.find((h) => h.key === "X-Frame-Options")?.value).toBe(
      "DENY",
    );
  });

  it("never allows a wildcard Supabase host", () => {
    const policy = csp(
      securityHeaders({
        supabaseUrl: "https://abcd.supabase.co",
        siteUrl: "https://www.emblematicocr.com",
      }),
    );
    expect(policy).not.toContain("*.supabase.co");
    expect(directive(policy, "connect-src")).toBe(
      "'self' https://abcd.supabase.co",
    );
    expect(directive(policy, "img-src")).toBe(
      "'self' data: blob: https://abcd.supabase.co",
    );
  });

  it("allows no Supabase origin without a valid URL", () => {
    const policy = csp(securityHeaders({}));
    expect(directive(policy, "connect-src")).toBe("'self'");
    expect(directive(policy, "img-src")).toBe("'self' data: blob:");
  });

  it("allows eval only in development", () => {
    const dev = csp(securityHeaders({ development: true }));
    const prod = csp(securityHeaders({ development: false }));
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    expect(directive(prod, "script-src")).not.toContain("'unsafe-eval'");
  });

  it("sends HSTS when the public site is HTTPS", () => {
    const headers = securityHeaders({
      siteUrl: "https://www.emblematicocr.com",
    });
    expect(
      headers.find((h) => h.key === "Strict-Transport-Security")?.value,
    ).toContain("max-age=63072000");
  });
});
