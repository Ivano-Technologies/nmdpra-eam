import { expect, test } from "@playwright/test";

test.describe("User consent API", () => {
  test("GET /api/user/consent requires authentication", async ({ request }) => {
    const res = await request.get("/api/user/consent?scope=terms");
    expect([401, 403]).toContain(res.status());
  });

  test("POST /api/user/consent requires authentication", async ({ request }) => {
    const res = await request.post("/api/user/consent", {
      data: { scope: "terms" },
      headers: { "Content-Type": "application/json" }
    });
    expect([401, 403]).toContain(res.status());
  });
});
