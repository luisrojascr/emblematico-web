import { describe, expect, it } from "vitest";

import { signPayload, verifyWhopSignature } from "./signature";

const secret = "ws_test_secret_value";
const now = new Date("2026-11-23T12:00:00Z");
const ts = String(Math.floor(now.getTime() / 1000));
const body = '{"id":"msg_1","type":"membership.activated","data":{}}';

const headers = (signature: string, timestamp = ts) => ({
  id: "msg_1",
  timestamp,
  signature,
});

describe("verifyWhopSignature", () => {
  it("accepts a valid v1 signature", () => {
    const sig = signPayload(secret, "msg_1", ts, body);
    expect(verifyWhopSignature(secret, headers(`v1,${sig}`), body, now)).toEqual({
      ok: true,
    });
  });

  it("accepts when one of several signatures matches", () => {
    const sig = signPayload(secret, "msg_1", ts, body);
    const result = verifyWhopSignature(
      secret,
      headers(`v1,AAAA v1,${sig}`),
      body,
      now,
    );
    expect(result.ok).toBe(true);
  });

  it("keys the HMAC with the whole secret, prefix included", () => {
    const stripped = signPayload("test_secret_value", "msg_1", ts, body);
    expect(
      verifyWhopSignature(secret, headers(`v1,${stripped}`), body, now),
    ).toEqual({ ok: false, reason: "mismatch" });
  });

  it("rejects a modified body", () => {
    const sig = signPayload(secret, "msg_1", ts, body);
    expect(
      verifyWhopSignature(secret, headers(`v1,${sig}`), `${body} `, now),
    ).toEqual({ ok: false, reason: "mismatch" });
  });

  it("rejects stale or malformed timestamps", () => {
    const old = String(Number(ts) - 10 * 60);
    const sig = signPayload(secret, "msg_1", old, body);
    expect(verifyWhopSignature(secret, headers(`v1,${sig}`, old), body, now)).toEqual(
      { ok: false, reason: "bad_timestamp" },
    );
    expect(
      verifyWhopSignature(secret, headers("v1,x", "12.5"), body, now).ok,
    ).toBe(false);
  });

  it("rejects missing headers", () => {
    expect(
      verifyWhopSignature(secret, { id: null, timestamp: ts, signature: "v1,x" }, body, now),
    ).toEqual({ ok: false, reason: "missing_headers" });
  });
});
