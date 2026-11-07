import { expect, test } from "@playwright/test";

import { signIn } from "./auth";

test("admin creates a business, the client publishes, the old slug redirects, and suspend returns 404", async ({
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one mutating run");
  test.setTimeout(180_000);

  const stamp = Date.now().toString(36);
  const name = `E2E ${stamp}`;
  const slug = `e2e-${stamp}`;
  const nextSlug = `${slug}-nuevo`;
  const tagline = `Lema ${stamp}`;

  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await signIn(admin, "admin@emblematico.test");
  await expect(admin).toHaveURL(/\/admin/);

  await admin.goto("/admin/negocios/nuevo");
  await admin.getByLabel("Nombre").fill(name);
  await admin.getByLabel("Slug").fill(slug);
  await admin.getByLabel("Categoría").fill("Hotel");
  await admin.getByRole("button", { name: "Crear negocio" }).click();
  await expect(admin.getByRole("status")).toHaveText(
    "Listo. El registro quedó creado.",
  );
  await expect(admin).toHaveURL(/\/admin\/negocios\/[0-9a-f-]{36}/);

  await admin.getByLabel("Persona").selectOption({ label: "Cliente Demo" });
  await admin.getByRole("button", { name: "Asignar acceso" }).click();
  await expect(admin.getByRole("status")).toHaveText("Acceso actualizado.");

  const clientContext = await browser.newContext();
  const client = await clientContext.newPage();
  await signIn(client, "cliente@emblematico.test");
  await client.goto("/panel");
  await client.getByRole("link", { name: new RegExp(name) }).click();
  await client.getByLabel("Lema").fill(tagline);
  await client.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(client.getByRole("status")).toHaveText("Borrador guardado.");
  client.once("dialog", (dialog) => dialog.accept());
  await client.getByRole("button", { name: "Publicar" }).click();
  await expect(client.getByRole("status")).toHaveText(
    "La página pública ya muestra este borrador.",
  );

  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  await guest.goto(`/negocio/${slug}`);
  await expect(guest.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(guest.getByText(tagline)).toBeVisible();

  await admin.goto(admin.url().split("?")[0]);
  await admin.getByRole("textbox", { name: "Slug", exact: true }).fill(nextSlug);
  await admin
    .getByRole("checkbox", { name: /Confirmo el cambio de slug/ })
    .check();
  await admin.getByRole("button", { name: "Guardar negocio" }).click();
  await expect(admin.getByRole("status")).toHaveText("Cambios guardados.");

  const redirect = await guest.request.get(`/negocio/${slug}`, {
    maxRedirects: 0,
  });
  expect(redirect.status()).toBe(308);
  expect(redirect.headers().location).toContain(`/negocio/${nextSlug}`);
  await guest.goto(`/negocio/${slug}`);
  await expect(guest.getByText(tagline)).toBeVisible();

  await admin.getByRole("button", { name: "Suspender" }).click();
  await expect(admin.getByRole("status")).toHaveText("Estado actualizado.");
  const hidden = await guest.goto(`/negocio/${nextSlug}`);
  expect(hidden?.status()).toBe(404);
  await expect(
    guest.getByRole("heading", { name: "Esta página no está disponible" }),
  ).toBeVisible();

  await guestContext.close();
  await clientContext.close();
  await adminContext.close();
});
