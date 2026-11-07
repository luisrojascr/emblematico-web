import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/contacto",
  "/productos",
  "/ingresar",
  "/negocio/casa-brisa",
];

for (const path of PAGES) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = results.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}
