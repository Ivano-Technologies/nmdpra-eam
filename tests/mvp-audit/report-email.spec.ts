import { expect, test } from "@playwright/test";
import pdfParse from "pdf-parse";
import { EmailSchema } from "@rmlis/resend-client";

import { withTestRunId } from "./helpers/withTestRunId";

test.describe("Report + email flow", () => {
  test("pdf then scoped email capture", async ({ request }, testInfo) => {
    const scoped = await withTestRunId(request, testInfo);

    const pdfRes = await scoped.get("/api/reports/mvp.pdf?reportId=FLOW-001");
    expect(pdfRes.status()).toBe(200);
    expect(pdfRes.headers()["content-type"]).toContain("application/pdf");
    const pdfBuffer = await pdfRes.body();
    expect(pdfBuffer.byteLength).toBeGreaterThan(2000);
    const parsed = await pdfParse(Buffer.from(pdfBuffer));
    expect(parsed.text).toContain("Institutional Reporting MVP");

    const post = await scoped.post("/api/reports/mvp/email", {
      data: { to: "report-flow@example.com" },
      headers: { "Content-Type": "application/json" }
    });
    expect(post.status()).toBe(200);

    const fetchEmails = await scoped.get("/api/__e2e__/last-resend");
    expect(fetchEmails.status()).toBe(200);
    const body = (await fetchEmails.json()) as { emails: unknown[] };
    expect(body.emails.length).toBe(1);

    const parsedEmail = EmailSchema.parse(body.emails[0]);
    expect(parsedEmail.subject).toContain("Institutional Report");
    expect(parsedEmail.html).toContain("/api/reports/mvp.pdf");
    expect(parsedEmail.html).toContain("Download URL");

    await scoped.dispose();
  });
});
