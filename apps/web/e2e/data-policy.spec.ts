import { expect, test } from "@playwright/test";

test.describe("Data policy (static)", () => {
  test("loads draft policy page", async ({ page }) => {
    await page.goto("/data-policy");
    await expect(page).toHaveURL(/\/data-policy/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
