import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ESSENTIAL_MAX_PROPERTIES, TRIAL_DAYS, getPlan } from "./plans";

/**
 * The database enforces the trial length and the property limits, and src/lib/plans.ts
 * drives the UI. These numbers live in both places, so this test fails when they drift.
 */
const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/20261117000012_subscriptions.sql"),
  "utf8",
);

function capture(pattern: RegExp): number {
  const match = pattern.exec(sql);
  if (!match) throw new Error(`pattern not found in migration: ${pattern}`);
  return Number(match[1]);
}

describe("plans.ts and the subscriptions migration agree", () => {
  it("trial length", () => {
    expect(capture(/function public\.trial_days\(\)[\s\S]*?select (\d+)/)).toBe(
      TRIAL_DAYS,
    );
  });

  it("Free property limit", () => {
    expect(capture(/when 'free' then (\d+)/)).toBe(getPlan("free")?.properties);
  });

  it("Essential included properties and cap", () => {
    expect(
      capture(/least\(3 \+ coalesce\(s\.extra_properties, 0\), (\d+)\)/),
    ).toBe(ESSENTIAL_MAX_PROPERTIES);
    expect(capture(/least\((\d+) \+ coalesce/)).toBe(
      getPlan("essential")?.properties,
    );
  });

  it("Plus included properties", () => {
    expect(capture(/when 'plus' then (\d+) \+/)).toBe(
      getPlan("plus")?.properties,
    );
  });
});
