import { expect, test } from "@playwright/test";

test("home renders hospitality headline in Spanish", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es-CR");
  await expect(
    page.getByRole("heading", {
      name: "Una mejor bienvenida. Menos trabajo para tu propiedad.",
    }),
  ).toBeVisible();
});

test("home lists the Essential and Plus plans, with Free only as the guarantee", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Hospitality Essential").first()).toBeVisible();
  await expect(page.getByText("Hospitality Plus").first()).toBeVisible();
  // Since the reverse trial (Nov 2026) Free has no card; it shows as a guarantee.
  await expect(page.getByText("Hospitality Free")).toHaveCount(0);
  await expect(
    page.getByText(/Tu QR nunca deja de funcionar/).first(),
  ).toBeVisible();
});

test("demo page shows the live guide on desktop and a direct link on mobile", async ({
  page,
  isMobile,
}) => {
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { level: 1, name: /Casa Nébora/ }),
  ).toBeVisible();
  if (isMobile) {
    await expect(
      page.getByRole("link", { name: "Abrir la guía de ejemplo" }),
    ).toHaveAttribute(
      "href",
      "https://www.emblematicocr.com/negocio/casa-nebora",
    );
    await expect(page.locator("iframe")).toHaveCount(0);
  } else {
    await expect(
      page.locator('iframe[title="Guía de ejemplo de Casa Nébora"]'),
    ).toHaveAttribute(
      "src",
      "https://www.emblematicocr.com/negocio/casa-nebora",
    );
  }
});

test("visitor can browse from catalog to a product and see a WhatsApp quote link", async ({
  page,
}) => {
  await page.goto("/productos");
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
  await page
    .getByRole("button", { name: "Solicitar demo o propuesta" })
    .click();
  await expect(page.getByText("Ingresa tu nombre")).toBeVisible();
  await expect(page.getByText("Ingresa tu número de WhatsApp")).toBeVisible();
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
  // Wi-Fi is an accordion section, closed until the guest opens it.
  await page.locator("summary", { hasText: "Wi‑Fi" }).click();
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

test("the menu marks the page being viewed", async ({ page, isMobile }) => {
  const nav = page.getByRole("navigation", {
    name: isMobile ? "Principal móvil" : "Principal",
    exact: true,
  });
  await page.goto("/productos/welcome-station/welcome-station-clasica");
  await expect(nav.getByRole("link", { name: "Productos" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link", { name: "Inicio" })).not.toHaveAttribute(
    "aria-current",
  );
  await page.goto("/demo");
  await expect(nav.getByRole("link", { name: "Ver demo" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
