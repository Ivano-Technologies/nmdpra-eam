import { expect, test } from "@playwright/test";

test.describe("Not found", () => {
  test("unknown path returns 404 page", async ({ page }) => {
    const res = await page.goto("/this-route-should-not-exist-12345");
    expect(res?.status()).toBe(404);
    await expect(page.locator("body")).toBeVisible();
  });
});
