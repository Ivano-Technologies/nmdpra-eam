import { expect, test } from "@playwright/test";
import { EmailSchema } from "@rmlis/resend-client";

import { withTestRunId } from "./helpers/withTestRunId";

test.describe("Email isolation", () => {
  test("captures only current test-run emails", async ({ request }, testInfo) => {
    const scoped = await withTestRunId(request, testInfo);

    const send = await scoped.post("/api/reports/mvp/email", {
      data: { to: "qa-institutional@example.com" },
      headers: { "Content-Type": "application/json" }
    });
    expect(send.status()).toBe(200);

    const read = await scoped.get("/api/__e2e__/last-resend");
    expect(read.status()).toBe(200);
    const body = (await read.json()) as { emails: unknown[] };
    expect(Array.isArray(body.emails)).toBe(true);
    expect(body.emails.length).toBe(1);

    const parsed = EmailSchema.parse(body.emails[0]);
    expect(parsed.to).toEqual(["qa-institutional@example.com"]);
    expect(parsed.subject).toContain("Institutional Report");
    expect(parsed.html).toContain("Download URL");

    await scoped.dispose();
  });
});
