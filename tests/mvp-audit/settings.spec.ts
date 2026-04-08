import { expect, test } from "@playwright/test";

import { screenshotStep } from "./helpers/screenshot";

test.describe("Settings (authenticated)", () => {
  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
    await screenshotStep(page, "settings-page");
  });
});
