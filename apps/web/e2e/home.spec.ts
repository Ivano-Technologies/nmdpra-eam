import { expect, test } from "@playwright/test";

test.describe("Home", () => {
  test("shows hero and pilot label", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Stay Ahead of Regulatory Risk"
    );
    await expect(page.getByText("Pilot / demonstration")).toBeVisible();
  });

  test("shows trust strip and product sections", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText(/Trusted by regulators, operators, and compliance teams/i)
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Who it's for/i })).toBeVisible();
  });
});
