import { expect, test } from "@playwright/test";

import { signIn } from "./auth";

test("dashboard language persists through navigation and reload and preserves unsaved fields", async ({
  page,
}) => {
  await signIn(page, "cliente@emblematico.test");
  await page.goto("/panel");

  await page.getByLabel("Idioma del panel").selectOption("en");
  await expect(
    page.getByRole("navigation", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Settings", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Dashboard language")).toHaveValue("en");

  await page.getByLabel("Name", { exact: true }).fill("Nombre sin guardar");
  await page.getByLabel("Dashboard language").selectOption("fr");
  await expect(
    page.getByRole("heading", { name: "Paramètres", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Nom", { exact: true })).toHaveValue(
    "Nombre sin guardar",
  );
  await page.reload();
  await expect(page.getByLabel("Langue du tableau de bord")).toHaveValue("fr");

  await page.getByLabel("Langue du tableau de bord").selectOption("es");
  await page.getByRole("link", { name: "Inicio", exact: true }).click();
  await expect(page.getByLabel("Idioma del panel")).toHaveValue("es");
  await expect(
    page
      .locator("[lang=es]")
      .filter({ has: page.getByLabel("Idioma del panel") }),
  ).toBeVisible();
});
