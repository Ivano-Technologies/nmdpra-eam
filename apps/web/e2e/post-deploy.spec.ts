import { expect, test } from "@playwright/test";

/**
 * Extra checks that are especially useful after a deploy (cold start, CDN, assets).
 * The full suite in other specs still runs for complete coverage.
 */
test.describe("Post-deploy smoke", () => {
  test("home includes Ivano IQ branding", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "IVANO IQ"
      })
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.locator("footer").getByText("Powered by Techivano")).toBeVisible();
  });

  test("static assets respond", async ({ request }) => {
    const fav = await request.get("/favicon.ico");
    expect([200, 304]).toContain(fav.status());

    const icon = await request.get("/icon.png");
    expect([200, 304]).toContain(icon.status());

    const brandMark = await request.get("/brand/techivano-mark.png");
    expect([200, 304]).toContain(brandMark.status());

    const brandMarkLight = await request.get("/brand/techivano-mark-light.png");
    expect([200, 304]).toContain(brandMarkLight.status());

    const og = await request.get("/opengraph-image");
    expect([200, 304]).toContain(og.status());
    if (og.ok()) {
      const type = og.headers()["content-type"] ?? "";
      expect(type).toMatch(/image/i);
    }
  });
});
