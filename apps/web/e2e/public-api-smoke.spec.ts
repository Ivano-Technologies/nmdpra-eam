import { expect, test } from "@playwright/test";

/**
 * Smoke checks for routes that should not 5xx without auth (or return expected status).
 * Authenticated-only routes may return 401 — that is acceptable.
 */
test.describe("Public API smoke", () => {
  test("GET /api/licenses/risk-ranking responds", async ({ request }) => {
    const res = await request.get("/api/licenses/risk-ranking");
    expect([200, 401, 403]).toContain(res.status());
  });

  test("GET /api/audit-logs responds", async ({ request }) => {
    const res = await request.get("/api/audit-logs");
    expect([200, 401, 403]).toContain(res.status());
  });
});
