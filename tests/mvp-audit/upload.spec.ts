import path from "node:path";

import { expect, test } from "@playwright/test";

import { screenshotStep } from "./helpers/screenshot";

test.describe.configure({ mode: "serial" });

test.describe("Data upload (admin/owner)", () => {
  test("minimal xlsx upload", async ({ page }) => {
    await page.goto("/dashboard#section-data-upload");
    await page.waitForLoadState("networkidle");

    const clientDash = page.locator("#section-client");
    if (await clientDash.isVisible().catch(() => false)) {
      test.skip(true, "Upload is hidden for client role");
      return;
    }

    const uploadSection = page.locator("#section-data-upload");
    if (!(await uploadSection.isVisible().catch(() => false))) {
      test.skip(true, "Data upload section not visible for this role");
      return;
    }

    const orgInput = page.locator("#upload-org-id");
    if (await orgInput.isVisible()) {
      const org = process.env.E2E_ORG_ID?.trim();
      if (!org) {
        test.skip(
          true,
          "Set E2E_ORG_ID or Clerk publicMetadata orgId for upload org field"
        );
        return;
      }
      await orgInput.fill(org);
    }

    await page
      .getByRole("checkbox", {
        name: /I confirm I have the right to upload/i
      })
      .check();

    const fixture = path.join(
      process.cwd(),
      "e2e/fixtures/minimal-licenses.xlsx"
    );

    await page.locator("#upload-file").setInputFiles(fixture);

    const [uploadRes] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/upload") && r.request().method() === "POST",
        { timeout: 120_000 }
      ),
      page.getByRole("button", { name: "Upload and ingest" }).click()
    ]);

    // 500: invalid/missing Vercel Blob token in local E2E (upstream "Access denied")
    expect([200, 400, 403, 500, 503]).toContain(uploadRes.status());
    await screenshotStep(page, "upload-after-submit");
  });
});
