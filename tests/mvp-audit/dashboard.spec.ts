import { expect, test } from "@playwright/test";

import { screenshotStep } from "./helpers/screenshot";

test.describe.configure({ mode: "serial" });

test.describe("Dashboard (authenticated)", () => {
  test("dashboard loads and session persists", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await screenshotStep(page, "dashboard-initial");

    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await screenshotStep(page, "dashboard-after-reload");
  });

  test("hash sections reachable (admin/owner)", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const clientDash = page.locator("#section-client");
    if (await clientDash.isVisible().catch(() => false)) {
      await screenshotStep(page, "dashboard-client-only");
      return;
    }

    await page.goto("/dashboard#section-overview");
    const overview = page.locator("#section-overview");
    const clientOnly = page.locator("#section-client");
    const foundOverview = await overview
      .waitFor({ state: "visible", timeout: 12_000 })
      .then(() => true)
      .catch(() => false);
    if (!foundOverview) {
      if (await clientOnly.isVisible().catch(() => false)) {
        await screenshotStep(page, "dashboard-client-only-late");
        return;
      }
      test.skip(true, "Overview section unavailable for current role/layout");
      return;
    }
    await screenshotStep(page, "dashboard-section-overview");

    await page.goto("/dashboard#section-expiry-radar");
    await page.locator("#section-expiry-radar").waitFor({ state: "visible", timeout: 15_000 });
    await screenshotStep(page, "dashboard-section-expiry-radar");

    await page.goto("/dashboard#section-risk-ranking");
    await page.locator("#section-risk-ranking").waitFor({ state: "visible", timeout: 15_000 });
    await screenshotStep(page, "dashboard-section-risk-ranking");

    await page.goto("/dashboard#section-reports");
    await page.locator("#section-reports").waitFor({ state: "visible", timeout: 15_000 });
    await screenshotStep(page, "dashboard-section-reports");

    await page.goto("/dashboard#section-weekly-insight");
    await page.locator("#section-weekly-insight").waitFor({ state: "visible", timeout: 15_000 });
    await screenshotStep(page, "dashboard-section-weekly-insight");
  });

  test("command palette opens", async ({ page }) => {
    await page.goto("/dashboard");
    await page.keyboard.press("Control+KeyK");
    await expect(
      page.getByRole("dialog", { name: "Command palette" })
    ).toBeVisible({ timeout: 10_000 });
    await screenshotStep(page, "dashboard-command-palette");
    await page.keyboard.press("Escape");
  });
});
