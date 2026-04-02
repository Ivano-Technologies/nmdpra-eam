import { expect, test } from "@playwright/test";

test.describe("Home", () => {
  test("shows hero primary call-to-action", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("main > section").first();
    await expect(hero.getByText("Explore the Platform").first()).toBeVisible();
  });

  test("shows trust strip and product sections", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText(/Trusted by regulators, operators, and compliance teams/i)
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Who it's for/i })).toBeVisible();
  });
});
