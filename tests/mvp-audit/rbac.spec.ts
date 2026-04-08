import { expect, test } from "@playwright/test";

import { screenshotStep } from "./helpers/screenshot";

test.describe("RBAC smoke (authenticated)", () => {
  test("role badge visible in header", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const badge = page.getByText(/owner|admin|client/i).first();
    await expect(badge).toBeVisible({ timeout: 15_000 });
    await screenshotStep(page, "rbac-role-badge");
  });
});
