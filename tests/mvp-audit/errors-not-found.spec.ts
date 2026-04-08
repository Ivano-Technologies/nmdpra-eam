import { expect, test } from "@playwright/test";

import { screenshotStep } from "./helpers/screenshot";

test.describe("Errors & auth gate (authenticated project)", () => {
  test("dashboard still reachable after errors smoke", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await screenshotStep(page, "errors-dashboard-ok");
  });
});
