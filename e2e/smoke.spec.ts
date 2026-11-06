import { expect, test } from "@playwright/test";

test("home renders brand tagline in Spanish", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es-CR");
  await expect(
    page.getByRole("heading", {
      name: "Diseño y soluciones que distinguen tu negocio.",
    }),
  ).toBeVisible();
});

test("visitor can browse from catalog to a product and see a WhatsApp quote link", async ({
  page,
}) => {
  await page.goto("/productos");
  await page
    .getByRole("link", { name: /Welcome Station/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/productos\/welcome-station$/);
  await page.getByRole("link", { name: /Welcome Station clásica/ }).click();
  await expect(page).toHaveURL(
    /\/productos\/welcome-station\/welcome-station-clasica$/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Welcome Station clásica",
  );

  const whatsapp = page
    .getByRole("link", { name: "Cotizar por WhatsApp" })
    .first();
  await expect(whatsapp).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/50688997060\?text=/,
  );
});

test("contact form validates required fields", async ({ page }) => {
  await page.goto("/contacto");
  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.getByText("Ingresa tu nombre")).toBeVisible();
  await expect(
    page.getByText("Déjanos un teléfono o un correo para contactarte"),
  ).toBeVisible();
});

test("unknown product shows the Spanish not-found page", async ({ page }) => {
  const response = await page.goto("/productos/welcome-station/no-existe");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "No encontramos esta página" }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    "content",
    /noindex/,
  );
});

test("public business page renders its template without site chrome", async ({
  page,
}) => {
  // Requires the dev seed (pnpm seed:dev): Casa Brisa, hospitality, published.
  const response = await page.goto("/negocio/casa-brisa");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { level: 1, name: "Casa Brisa" }),
  ).toBeVisible();
  await expect(page.getByText("CasaBrisa_Guest")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Escribir al anfitrión" }),
  ).toHaveAttribute("href", /^https:\/\/wa\.me\/50688997060/);
  // Private by default and no emblemático header/footer around client pages.
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expect(page.getByRole("link", { name: "Productos" })).toHaveCount(0);
});

test("admin requires sign-in", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/ingresar/);
  await expect(page.getByRole("heading", { name: "Ingresar" })).toBeVisible();
});

test("unpublished or unknown business slug returns 404", async ({ page }) => {
  const response = await page.goto("/negocio/no-existe-este-negocio");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Esta página no está disponible" }),
  ).toBeVisible();
});
