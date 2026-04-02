import { expect, test } from "@playwright/test";

test.describe("Auth-protected routes", () => {
  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("dashboard redirects unauthenticated users to sign-in", async ({
    page
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("settings redirects unauthenticated users to sign-in", async ({
    page
  }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/sign-in/);
  });
});
