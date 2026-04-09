import { expect, test } from "@playwright/test";

test.describe("Home", () => {
  test("shows hero primary call-to-action", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("main > section").first();
    await expect(hero.getByText("Explore the Platform").first()).toBeVisible();
  });

  test("shows product feature sections", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Unified Visibility/i })
    ).toBeVisible();
  });
});
