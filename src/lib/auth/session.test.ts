import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { safeNextPath } from "./session";

describe("safeNextPath", () => {
  it("allows internal paths", () => {
    expect(safeNextPath("/panel/abc")).toBe("/panel/abc");
  });

  it("keeps query and hash", () => {
    expect(safeNextPath("/panel/abc?tab=qr#top")).toBe("/panel/abc?tab=qr#top");
  });

  it.each([
    null,
    undefined,
    "",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "panel",
    // The parser strips tab/newline/CR, turning these into //evil.com.
    "/\t/evil.com",
    "/\n/evil.com",
    "/\r/evil.com",
    "/\t\\evil.com",
  ])("falls back for %j", (value) => {
    expect(safeNextPath(value)).toBe("/panel");
  });

  it.each(["/%09/evil.com", "/%0a/evil.com", "/%0d/evil.com"])(
    "falls back when the callback query %s is decoded by searchParams",
    (encoded) => {
      // Mirrors the callback route: ?next=/%09/evil.com -> "/\t/evil.com".
      const next = new URL(
        `https://app.example/auth/callback?next=${encoded}`,
      ).searchParams.get("next");
      expect(safeNextPath(next)).toBe("/panel");
    },
  );

  it("treats still-encoded control chars as a plain on-origin path", () => {
    expect(safeNextPath("/%2509/evil.com")).toBe("/%2509/evil.com");
  });

  it("never resolves to a foreign origin for any control-char variant", () => {
    const controls = ["\t", "\n", "\r", "\u0000", "\u200b"];
    for (const a of controls) {
      for (const b of controls) {
        const result = safeNextPath(`/${a}${b}/evil.com`);
        const url = new URL(result, "https://app.example");
        expect(url.origin).toBe("https://app.example");
      }
    }
  });
});
