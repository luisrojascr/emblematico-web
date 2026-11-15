import { expect, test } from "@playwright/test";

test("responses send security headers and a CSP", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["referrer-policy"]).toBe(
    "strict-origin-when-cross-origin",
  );
  const csp = response?.headers()["content-security-policy"] ?? "";
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
});

test("only the demo guide can be framed, and /demo can frame the live one", async ({
  request,
}) => {
  const guide = await request.get("/negocio/casa-nebora");
  expect(guide.headers()["x-frame-options"]).toBeUndefined();
  expect(guide.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'self' https://www.emblematicocr.com",
  );

  const client = await request.get("/negocio/casa-brisa");
  expect(client.headers()["x-frame-options"]).toBe("DENY");
  expect(client.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );

  const demo = await request.get("/demo");
  expect(demo.headers()["x-frame-options"]).toBe("DENY");
  expect(demo.headers()["content-security-policy"]).toContain(
    "frame-src 'self' https://www.emblematicocr.com",
  );
});
