import { expect, test } from "@playwright/test";

import { emailLink, signIn } from "./auth";

/**
 * Self-serve signup end to end (phase 6). Needs the local Supabase stack with Mailpit
 * and the seeded admin (scripts/seed-dev-users.mjs). Turnstile stays off locally
 * (no NEXT_PUBLIC_TURNSTILE_SITE_KEY), so no captcha is shown.
 */

test("a visitor signs up, confirms the email and starts the trial; a suspended account cannot sign in", async ({
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one mutating run");
  test.setTimeout(180_000);

  const stamp = Date.now().toString(36);
  const fullName = `Registro ${stamp}`;
  // Supabase Auth rejects domains without mail servers (example.com, .test), so the
  // address uses a real domain. Locally every email lands in Mailpit, nothing is sent.
  // No "+tag": the database treats Gmail "+" aliases as the same person.
  const email = `e2e${stamp}@gmail.com`;
  const password = `Prueba${stamp}9`;

  // 1. Signup --------------------------------------------------------------------
  const visitorContext = await browser.newContext();
  const visitor = await visitorContext.newPage();
  await visitor.goto("/registro");
  await visitor.getByLabel("Nombre").fill(fullName);
  await visitor.getByLabel("Correo electrónico").fill(email);
  await visitor.getByLabel("Contraseña", { exact: true }).fill(password);
  await visitor.getByRole("checkbox", { name: /Acepto los/ }).check();
  const sentAt = Date.now();
  await visitor.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(visitor).toHaveURL(/\/registro\/verifica/);
  await expect(
    visitor.getByRole("heading", { name: "Revisa tu correo" }),
  ).toBeVisible();

  // 2. Email confirmation -----------------------------------------------------------
  const link = await emailLink(email, sentAt);
  expect(link).toContain("/auth/confirm");
  await visitor.goto(link);
  await visitor.getByRole("button", { name: "Confirmar mi correo" }).click();
  await expect(visitor).toHaveURL(/\/panel/);

  // 3. The trial is running ------------------------------------------------------------
  await expect(
    visitor.getByRole("status").filter({ hasText: /días de prueba/ }),
  ).toContainText(/Te quedan \d+ días de prueba/);
  await visitorContext.close();

  // 4. An admin suspends the account ------------------------------------------------------
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await signIn(admin, "admin@emblematico.test");
  await admin.goto(`/admin/usuarios?q=${encodeURIComponent(email)}`);
  await admin.getByRole("link", { name: new RegExp(fullName) }).click();
  await expect(admin).toHaveURL(/\/admin\/usuarios\/[0-9a-f-]{36}/);
  await admin.getByLabel("Motivo").fill("Prueba automática de suspensión");
  await admin.getByRole("button", { name: "Suspender cuenta" }).click();
  await expect(
    admin.getByRole("status").filter({ hasText: "Cuenta suspendida" }),
  ).toBeVisible();
  await adminContext.close();

  // 5. The suspended account cannot sign in ------------------------------------------------
  const blockedContext = await browser.newContext();
  const blocked = await blockedContext.newPage();
  await blocked.goto("/ingresar");
  await blocked.getByLabel("Correo electrónico").fill(email);
  await blocked.getByLabel("Contraseña", { exact: true }).fill(password);
  await blocked.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(blocked.getByText(/Tu cuenta está suspendida/)).toBeVisible();
  await expect(blocked).toHaveURL(/\/ingresar/);
  await blockedContext.close();
});

test("a guest reports a guide and an admin reviews it", async ({
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one mutating run");
  test.setTimeout(120_000);

  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  await guest.goto("/negocio/casa-brisa");
  await guest.locator('a[href^="/reportar"]').click();
  await expect(guest).toHaveURL(/\/reportar\?guia=casa-brisa/);
  await expect(guest.getByText("Casa Brisa", { exact: true })).toBeVisible();
  await guest.getByLabel("Parece una estafa o un fraude").check();
  await guest
    .getByLabel(/Cuéntanos qué viste/)
    .fill(`Prueba automática ${Date.now().toString(36)}`);
  await guest.getByRole("button", { name: "Enviar reporte" }).click();
  // A repeat from the same IP within a day is accepted without a new row.
  await expect(guest.getByRole("status")).toContainText("Recibimos tu reporte");
  await guestContext.close();

  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await signIn(admin, "admin@emblematico.test");
  await admin.goto("/admin/reportes?estado=todos");
  const report = admin
    .getByRole("listitem")
    .filter({ has: admin.getByRole("heading", { name: "Casa Brisa" }) })
    .first();
  await expect(report).toBeVisible();
  await report
    .getByRole("button", { name: /Marcar revisado|Volver a abrir/ })
    .click();
  await expect(admin.getByRole("status")).toHaveText("Estado actualizado.");
  await adminContext.close();
});
