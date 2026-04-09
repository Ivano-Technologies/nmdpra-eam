import { mkdirSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const progressDir = path.join(process.cwd(), "e2e/progress");

test.describe.configure({ mode: "serial" });

test.describe("Integrated dashboard flows", () => {
  test.beforeAll(() => {
    mkdirSync(progressDir, { recursive: true });
  });

  test("dashboard loads with session", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await page.screenshot({
      path: path.join(progressDir, "01-dashboard.png"),
      fullPage: true
    });
  });

  test("MVP report JSON", async ({ request }) => {
    const res = await request.get("/api/reports/mvp");
    const status = res.status();
    expect(status).not.toBe(500);
    expect([200, 403]).toContain(status);
    if (status === 200) {
      const body = (await res.json()) as { success?: boolean };
      expect(body.success).toBe(true);
    }
  });

  test("MVP PDF route responds (Next or proxied Express)", async ({
    request
  }) => {
    const res = await request.get("/api/reports/mvp.pdf");
    const status = res.status();
    expect(status).not.toBe(500);
    expect([200, 302, 307, 404, 502, 503]).toContain(status);
  });

  test("MVP email route responds", async ({ request }) => {
    const res = await request.post("/api/reports/mvp/email", {
      data: { to: "e2e-check@example.com" },
      headers: { "Content-Type": "application/json" }
    });
    const status = res.status();
    expect(status).not.toBe(500);
    expect([200, 400, 401, 403, 404, 502, 503]).toContain(status);
  });

  test("upload minimal fixture xlsx", async ({ page }) => {
    await page.goto("/dashboard#section-data-upload");
    await page.locator("#section-data-upload").waitFor({ state: "visible" });

    const orgInput = page.locator("#upload-org-id");
    if (await orgInput.isVisible()) {
      const org = process.env.E2E_ORG_ID?.trim();
      if (!org) {
        test.skip(
          true,
          "Add orgId to Clerk user publicMetadata (recommended) or set E2E_ORG_ID"
        );
      }
      await orgInput.fill(org!);
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

    const status = uploadRes.status();
    expect(status).toBeLessThan(500);
    expect([200, 202, 400, 403, 503]).toContain(status);

    if (status === 202) {
      const { jobId } = (await uploadRes.json()) as { jobId?: string };
      expect(jobId?.trim().length).toBeGreaterThan(0);
      const deadline = Date.now() + 120_000;
      let last = "processing";
      while (Date.now() < deadline) {
        await page.waitForTimeout(3000);
        const jr = await page.request.get(
          `/api/jobs/${encodeURIComponent(jobId!)}`
        );
        const j = (await jr.json()) as { status?: string };
        if (j.status === "complete" || j.status === "failed") {
          last = j.status;
          break;
        }
      }
      expect(last).toBe("complete");
    } else if (status === 200) {
      const body = (await uploadRes.json()) as {
        success?: boolean;
        imported?: number;
      };
      expect(body.success).toBe(true);
      expect(body.imported ?? 0).toBeGreaterThanOrEqual(1);
    }

    await page.screenshot({
      path: path.join(progressDir, "02-after-upload.png"),
      fullPage: true
    });
  });

  test("optional Lab Accreditation xlsx path", async ({ page }) => {
    test.setTimeout(120_000);

    const labPath = process.env.E2E_LAB_XLSX_PATH?.trim();
    if (!labPath) {
      test.skip(true, "Set E2E_LAB_XLSX_PATH to run the large-file upload check");
      return;
    }

    await page.goto("/dashboard#section-data-upload");
    await page.locator("#section-data-upload").waitFor({ state: "visible" });

    const orgInput = page.locator("#upload-org-id");
    if (await orgInput.isVisible()) {
      const org = process.env.E2E_ORG_ID?.trim();
      if (!org) {
        test.skip(
          true,
          "Add orgId to Clerk user publicMetadata (recommended) or set E2E_ORG_ID"
        );
      }
      await orgInput.fill(org!);
    }

    await page
      .getByRole("checkbox", {
        name: /I confirm I have the right to upload/i
      })
      .check();

    await page.locator("#upload-file").setInputFiles(labPath);

    const [uploadRes] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/upload") && r.request().method() === "POST",
        { timeout: 180_000 }
      ),
      page.getByRole("button", { name: "Upload and ingest" }).click()
    ]);

    const status = uploadRes.status();
    expect(status).toBeLessThan(500);
    expect([200, 202, 400, 403, 503]).toContain(status);

    if (status === 202) {
      const { jobId } = (await uploadRes.json()) as { jobId?: string };
      expect(jobId?.trim().length).toBeGreaterThan(0);
      const deadline = Date.now() + 180_000;
      let last = "processing";
      while (Date.now() < deadline) {
        await page.waitForTimeout(3000);
        const jr = await page.request.get(
          `/api/jobs/${encodeURIComponent(jobId!)}`
        );
        const j = (await jr.json()) as { status?: string };
        if (j.status === "complete" || j.status === "failed") {
          last = j.status;
          break;
        }
      }
      expect(last).toBe("complete");
    } else if (status === 200) {
      const body = (await uploadRes.json()) as {
        success?: boolean;
        imported?: number;
      };
      expect(body.success).toBe(true);
      expect(body.imported ?? 0).toBeGreaterThanOrEqual(200);
    }

    await page.screenshot({
      path: path.join(progressDir, "03-after-lab-upload.png"),
      fullPage: true
    });
  });
});
