import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { screenshotsDir } from "./helpers/paths";
import { screenshotStep } from "./helpers/screenshot";

test.describe.configure({ mode: "serial" });

test.describe("Reports & PDF (authenticated)", () => {
  test("MVP JSON via fetch", async ({ page }) => {
    await page.goto("/dashboard");
    const json = await page.evaluate(async () => {
      const res = await fetch("/api/reports/mvp");
      const status = res.status;
      const body = await res.json().catch(() => ({}));
      return { status, body };
    });
    expect([200, 401, 403]).toContain(json.status);
    if (json.status === 200) {
      expect((json.body as { success?: boolean }).success).toBe(true);
    }
  });

  test("MVP PDF bytes and magic header", async ({ request }) => {
    const res = await request.get("/api/reports/mvp.pdf");
    expect(res.status()).toBe(200);
    const buf = await res.body();
    expect(buf.length).toBeGreaterThan(100);
    expect(Buffer.from(buf).subarray(0, 4).toString("utf8")).toBe("%PDF");

    mkdirSync(screenshotsDir, { recursive: true });
    const pdfPath = path.join(screenshotsDir, "reports-mvp-sample.pdf");
    writeFileSync(pdfPath, buf);
  });

  test("MVP email mock captures payload", async ({ request }) => {
    const res = await request.post("/api/reports/mvp/email", {
      data: { to: "mvp-audit@example.com" },
      headers: { "Content-Type": "application/json" }
    });
    expect([200]).toContain(res.status());

    const last = await request.get("/api/__e2e__/last-resend");
    expect(last.status()).toBe(200);
    const data = (await last.json()) as {
      emails: Array<{ to?: string[]; subject?: string; html?: string }>;
    };
    expect(data.emails.length).toBeGreaterThanOrEqual(1);
    const payload = data.emails[data.emails.length - 1];
    expect(payload.to).toContain("mvp-audit@example.com");
    expect(payload.subject).toMatch(/Institutional Report/i);
  });

  test("reports section UI screenshots", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    if (await page.locator("#section-client").isVisible().catch(() => false)) {
      test.skip(true, "Reports section not on client dashboard");
      return;
    }
    await page.goto("/dashboard#section-reports");
    await page.locator("#section-reports").waitFor({ state: "visible", timeout: 30_000 });
    await screenshotStep(page, "reports-section-before-actions");
  });
});
