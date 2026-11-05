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
  // With Cache Components the shell may already be streaming, so the HTTP status
  // can be 200; the page is still rendered as not-found with a noindex robots tag.
  await page.goto("/productos/welcome-station/no-existe");
  await expect(
    page.getByRole("heading", { name: "No encontramos esta página" }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    "content",
    /noindex/,
  );
});
