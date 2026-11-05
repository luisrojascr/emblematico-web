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
