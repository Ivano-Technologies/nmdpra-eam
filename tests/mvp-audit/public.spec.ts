import { expect, test } from "@playwright/test";

import { screenshotStep } from "./helpers/screenshot";

test.describe("Public pages", () => {
  test("landing loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
    await screenshotStep(page, "public-landing");
  });

  test("data policy loads", async ({ page }) => {
    await page.goto("/data-policy");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await screenshotStep(page, "public-data-policy");
  });

  test("health API", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const json = (await res.json()) as { status?: string };
    expect(json.status).toBe("ok");
  });

  test("unknown path 404", async ({ page }) => {
    const res = await page.goto("/mvp-audit-missing-route-xyz");
    expect(res?.status()).toBe(404);
    await expect(page.locator("body")).toBeVisible();
    await screenshotStep(page, "public-404");
  });
});
