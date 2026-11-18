import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CAPTCHA_FIELD,
  captchaEnabled,
  captchaMissing,
  captchaTokenOf,
  isCaptchaError,
} from "./captcha";
import {
  COUNTRY_CODES,
  DEFAULT_COUNTRY,
  countryOptions,
  isCountryCode,
} from "./countries";
import { isDisposableEmail } from "./disposable-domains";
import {
  PASSWORD_MAX_LENGTH,
  normalizeEmailInput,
  signupIssueMessage,
  signupSchema,
} from "./signup";

const valid = {
  fullName: "Ana Mora",
  email: "ana@example.com",
  password: "clave1234",
  country: "CR",
  acceptTerms: true,
};

describe("signupSchema", () => {
  it("accepts a valid signup", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["short name", { fullName: "A" }, "fullName"],
    ["bad email", { email: "not-an-email" }, "email"],
    ["short password", { password: "abc12" }, "password"],
    ["password without digits", { password: "sololetras" }, "password"],
    ["password without letters", { password: "12345678" }, "password"],
    [
      "password too long",
      { password: "a1".repeat(PASSWORD_MAX_LENGTH) },
      "password",
    ],
    ["unknown country", { country: "ZZ" }, "country"],
    ["terms not accepted", { acceptTerms: false }, "acceptTerms"],
  ])("rejects %s", (_name, patch, field) => {
    const result = signupSchema.safeParse({ ...valid, ...patch });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path[0]).toBe(field);
      expect(signupIssueMessage(result.error)).not.toBe("");
    }
  });

  it("trims the name", () => {
    const result = signupSchema.safeParse({
      ...valid,
      fullName: "  Ana Mora  ",
    });
    expect(result.success && result.data.fullName).toBe("Ana Mora");
  });
});

describe("normalizeEmailInput", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmailInput("  Ana@Example.COM ")).toBe("ana@example.com");
    expect(normalizeEmailInput(null)).toBe("");
  });
});

describe("isDisposableEmail", () => {
  it("flags known disposable domains and their subdomains", () => {
    expect(isDisposableEmail("x@mailinator.com")).toBe(true);
    expect(isDisposableEmail("x@Mailinator.com")).toBe(true);
    expect(isDisposableEmail("x@inbox.yopmail.com")).toBe(true);
  });

  it("lets normal providers through", () => {
    expect(isDisposableEmail("x@gmail.com")).toBe(false);
    expect(isDisposableEmail("x@notmailinator.com")).toBe(false);
    expect(isDisposableEmail("not-an-email")).toBe(false);
  });
});

describe("countries", () => {
  it("offers Costa Rica and rejects unknown codes", () => {
    expect(isCountryCode(DEFAULT_COUNTRY)).toBe(true);
    expect(isCountryCode("XX")).toBe(false);
    expect(isCountryCode("cr")).toBe(false);
  });

  it("has no duplicates and a Spanish name for every code", () => {
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length);
    const options = countryOptions("es");
    expect(options).toHaveLength(COUNTRY_CODES.length);
    for (const option of options) {
      expect(option.name).not.toBe(option.code);
    }
    expect(options.find((o) => o.code === "CR")?.name).toBe("Costa Rica");
  });
});

describe("captcha helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is off without a site key and requires a token with one", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    expect(captchaEnabled()).toBe(false);
    expect(captchaMissing(new FormData())).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "test-key");
    expect(captchaEnabled()).toBe(true);
    expect(captchaMissing(new FormData())).toBe(true);

    const form = new FormData();
    form.set(CAPTCHA_FIELD, "token-123");
    expect(captchaMissing(form)).toBe(false);
    expect(captchaTokenOf(form)).toBe("token-123");
  });

  it("recognizes the Supabase captcha error", () => {
    expect(isCaptchaError({ code: "captcha_failed" })).toBe(true);
    expect(isCaptchaError({ code: "weak_password" })).toBe(false);
    expect(isCaptchaError(null)).toBe(false);
  });
});
