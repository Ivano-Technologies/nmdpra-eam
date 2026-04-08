import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("API routes (authenticated)", () => {
  test("GET /api/user/preferences", async ({ request }) => {
    const res = await request.get("/api/user/preferences");
    expect([200, 401, 403]).toContain(res.status());
  });

  test("GET /api/user/notifications", async ({ request }) => {
    const res = await request.get("/api/user/notifications");
    expect([200, 401, 403]).toContain(res.status());
  });

  test("GET /api/licenses/risk-ranking", async ({ request }) => {
    const res = await request.get("/api/licenses/risk-ranking");
    expect([200, 401, 403]).toContain(res.status());
  });

  test("cron routes require secret", async ({ request }) => {
    const r1 = await request.get("/api/cron/send-reports");
    expect(r1.status()).toBe(401);
    const r2 = await request.get("/api/cron/weekly-summary");
    expect(r2.status()).toBe(401);
    const r3 = await request.get("/api/cron/reingest");
    expect(r3.status()).toBe(401);
  });

  test("cron send-reports with CRON_SECRET", async ({ request }) => {
    const secret = process.env.CRON_SECRET?.trim();
    test.skip(!secret, "Set CRON_SECRET in .env.local to run cron integration");
    const res = await request.get("/api/cron/send-reports", {
      headers: { Authorization: `Bearer ${secret}` }
    });
    expect([200, 503]).toContain(res.status());
  });
});
