import { describe, expect, it } from "vitest";

import { sessionFromHash } from "./hash-session";

const access = "a".repeat(24);
const refresh = "b".repeat(24);

describe("sessionFromHash", () => {
  it("reads both tokens from the fragment", () => {
    expect(
      sessionFromHash(`#access_token=${access}&refresh_token=${refresh}`),
    ).toEqual({
      accessToken: access,
      refreshToken: refresh,
    });
  });

  it("rejects missing or malformed tokens", () => {
    expect(sessionFromHash("")).toBeNull();
    expect(sessionFromHash(`#access_token=${access}`)).toBeNull();
    expect(
      sessionFromHash(`#access_token=short&refresh_token=${refresh}`),
    ).toBeNull();
    expect(
      sessionFromHash(
        `#access_token=${access}&refresh_token=${refresh}&next=https://evil.test`,
      ),
    ).toEqual({ accessToken: access, refreshToken: refresh });
  });
});
