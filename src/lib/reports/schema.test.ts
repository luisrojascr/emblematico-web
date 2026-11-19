import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { REPORT_REASONS, reportReasonLabel, reportSchema } from "./schema";

describe("reportSchema", () => {
  it("accepts a report without details or email", () => {
    const parsed = reportSchema.safeParse({
      reason: "scam",
      details: "",
      contactEmail: "",
    });
    expect(parsed.success).toBe(true);
  });

  it("trims the details and checks the email", () => {
    const parsed = reportSchema.safeParse({
      reason: "other",
      details: "  pide pagos por adelantado  ",
      contactEmail: "no-es-correo",
    });
    expect(parsed.success).toBe(false);
    const ok = reportSchema.parse({
      reason: "other",
      details: "  pide pagos por adelantado  ",
      contactEmail: "ana@example.com",
    });
    expect(ok.details).toBe("pide pagos por adelantado");
  });

  it("rejects an unknown reason and long details", () => {
    expect(
      reportSchema.safeParse({ reason: "spam", details: "", contactEmail: "" })
        .success,
    ).toBe(false);
    expect(
      reportSchema.safeParse({
        reason: "scam",
        details: "x".repeat(1001),
        contactEmail: "",
      }).success,
    ).toBe(false);
  });

  it("labels reasons", () => {
    expect(reportReasonLabel("scam")).toBe("Parece una estafa o un fraude");
    expect(reportReasonLabel("unknown")).toBe("unknown");
  });

  it("uses the same reasons as the database", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20261120000016_abuse_protections.sql",
      ),
      "utf8",
    );
    const match = /reason text not null check \(reason in \(([^)]*)\)\)/.exec(
      sql,
    );
    const ids = match?.[1]
      .split(",")
      .map((id) => id.trim().replaceAll("'", ""));
    expect(ids).toEqual(REPORT_REASONS.map((reason) => reason.id));
  });
});
