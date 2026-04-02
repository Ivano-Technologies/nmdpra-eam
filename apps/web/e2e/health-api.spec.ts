import { expect, test } from "@playwright/test";

test.describe("Health API", () => {
  test("returns ok and convexSecretConfigured boolean", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      status: string;
      convexSecretConfigured: boolean;
    };
    expect(body.status).toBe("ok");
    expect(typeof body.convexSecretConfigured).toBe("boolean");
  });
});
