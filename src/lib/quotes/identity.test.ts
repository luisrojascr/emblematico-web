import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { clientIpFromHeaders, quoteRateLimitIdentity } from "./identity";

const SALT = "test-salt-with-16-plus-chars";

describe("quoteRateLimitIdentity", () => {
  it("returns 64-char lowercase hex accepted by the database check", () => {
    const id = quoteRateLimitIdentity(
      new Headers({ "x-real-ip": "1.2.3.4" }),
      SALT,
    );
    expect(id).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable per IP and differs across IPs and salts", () => {
    const a = quoteRateLimitIdentity(
      new Headers({ "x-real-ip": "1.2.3.4" }),
      SALT,
    );
    expect(
      quoteRateLimitIdentity(new Headers({ "x-real-ip": "1.2.3.4" }), SALT),
    ).toBe(a);
    expect(
      quoteRateLimitIdentity(new Headers({ "x-real-ip": "5.6.7.8" }), SALT),
    ).not.toBe(a);
    expect(
      quoteRateLimitIdentity(
        new Headers({ "x-real-ip": "1.2.3.4" }),
        "another-salt-16-chars!",
      ),
    ).not.toBe(a);
  });

  it("refuses to run without a strong salt", () => {
    expect(() => quoteRateLimitIdentity(new Headers(), undefined)).toThrow(
      /QUOTE_IP_SALT/,
    );
    expect(() => quoteRateLimitIdentity(new Headers(), "short")).toThrow(
      /QUOTE_IP_SALT/,
    );
  });
});

describe("clientIpFromHeaders", () => {
  it("prefers platform headers over client-controllable x-forwarded-for", () => {
    const h = new Headers({
      "x-vercel-forwarded-for": "9.9.9.9",
      "x-forwarded-for": "6.6.6.6",
    });
    expect(clientIpFromHeaders(h)).toBe("9.9.9.9");
  });

  it("falls back to the first x-forwarded-for entry, then a shared bucket", () => {
    expect(
      clientIpFromHeaders(
        new Headers({ "x-forwarded-for": "7.7.7.7, 8.8.8.8" }),
      ),
    ).toBe("7.7.7.7");
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });
});
