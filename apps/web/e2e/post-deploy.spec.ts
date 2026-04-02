import { expect, test } from "@playwright/test";

/**
 * Extra checks that are especially useful after a deploy (cold start, CDN, assets).
 * The full suite in other specs still runs for complete coverage.
 */
test.describe("Post-deploy smoke", () => {
  test("home includes Techivano branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Techivano", { exact: false }).first()).toBeVisible({
      timeout: 60_000
    });
  });

  test("static assets respond", async ({ request }) => {
    const fav = await request.get("/favicon.ico");
    expect([200, 304]).toContain(fav.status());

    const icon = await request.get("/icon.png");
    expect([200, 304]).toContain(icon.status());

    const brandMark = await request.get("/brand/techivano-mark.png");
    expect([200, 304]).toContain(brandMark.status());

    const og = await request.get("/opengraph-image");
    expect([200, 304]).toContain(og.status());
    if (og.ok()) {
      const type = og.headers()["content-type"] ?? "";
      expect(type).toMatch(/image/i);
    }
  });
});
