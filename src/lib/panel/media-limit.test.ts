import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { MEDIA_LIMIT_PER_BUSINESS } from "./media-limit";

/** The panel message and the storage policy must use the same number. */
describe("media limit", () => {
  it("matches business_media_limit() in migration 16", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20261120000016_abuse_protections.sql",
      ),
      "utf8",
    );
    const match =
      /function public\.business_media_limit\(\)[\s\S]*?select (\d+);/.exec(
        sql,
      );
    expect(Number(match?.[1])).toBe(MEDIA_LIMIT_PER_BUSINESS);
  });
});
