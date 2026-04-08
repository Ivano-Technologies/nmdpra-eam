import { expect, test } from "@playwright/test";
import pdfParse from "pdf-parse";

test.describe("PDF generation", () => {
  test("mvp pdf is valid and contains expected content", async ({ request }) => {
    const res = await request.get("/api/reports/mvp.pdf");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");

    const buffer = await res.body();
    expect(buffer.byteLength).toBeGreaterThan(5000);

    const parsed = await pdfParse(Buffer.from(buffer));
    expect(parsed.text).toContain("Institutional Reporting MVP");
    expect(parsed.text).toContain("deterministic E2E validation");
    expect(parsed.text).toContain("Risk Distribution Chart");
  });
});
