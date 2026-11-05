import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { safeNextPath } from "./session";

describe("safeNextPath", () => {
  it("allows internal paths", () => {
    expect(safeNextPath("/panel/abc")).toBe("/panel/abc");
  });

  it.each([
    null,
    undefined,
    "",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "panel",
  ])("falls back for %s", (value) => {
    expect(safeNextPath(value)).toBe("/panel");
  });
});
