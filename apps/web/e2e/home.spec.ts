import { expect, test } from "@playwright/test";

test.describe("Home", () => {
  test("shows hero headline and insight-led copy", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("main > section").first();
    await expect(hero.getByRole("heading", { level: 1 })).toHaveText(
      "Stay Ahead of Regulatory Risk"
    );
    await expect(
      hero.getByText(/Turn compliance data into actionable operational intelligence/i)
    ).toBeVisible();
    await expect(hero.getByText(/Ivano IQ delivers operational intelligence/i)).toBeVisible();
  });

  test("shows trust strip and product sections", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText(/Trusted by regulators, operators, and compliance teams/i)
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Who it's for/i })).toBeVisible();
  });
});
