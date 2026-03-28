/**
 * CLI: fetch MVP report payload from Convex, write PDF, optionally email via Resend.
 *
 * Usage:
 *   pnpm --filter @rmlis/reporting report:run
 *   pnpm --filter @rmlis/reporting report:run -- --email
 *
 * Env: CONVEX_URL (required), REPORT_PDF_PATH (optional), REPORT_EMAIL_TO + RESEND_* for --email
 */
import { writeFile } from "fs/promises";
import { resolve } from "path";

import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import { makeFunctionReference } from "convex/server";

import { sendReportPdf } from "./email/emailService";
import { buildMvpPdf } from "./mvp/buildMvpPdf";
import type { MvpReportInput } from "./mvp/renderMvpReport";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") });
dotenv.config({ path: resolve(process.cwd(), "../../.env.local") });
dotenv.config({ path: resolve(process.cwd(), "../../.env") });

const mvpReportData = makeFunctionReference<"query", Record<string, never>, MvpReportInput>(
  "licenses:mvpReportData"
);

const main = async (): Promise<void> => {
  const url = process.env.CONVEX_URL?.trim();
  if (!url) {
    throw new Error("CONVEX_URL is required");
  }

  const client = new ConvexHttpClient(url);
  const data = (await client.query(mvpReportData, {})) as MvpReportInput;

  const pdf = await buildMvpPdf({
    generatedAt: data.generatedAt,
    summary: data.summary,
    rows: data.rows,
    topRiskVendors: data.topRiskVendors ?? []
  });

  const outPath =
    process.env.REPORT_PDF_PATH?.trim() || resolve(process.cwd(), "nmdpra-license-report.pdf");
  await writeFile(outPath, pdf);
  console.log(`Wrote PDF: ${outPath}`);

  const sendEmail = process.argv.includes("--email");
  if (sendEmail) {
    const to = process.env.REPORT_EMAIL_TO?.trim();
    if (!to) {
      throw new Error("Set REPORT_EMAIL_TO when using --email");
    }
    const result = await sendReportPdf({
      to,
      pdf,
      subject: `NMDPRA licence report — ${data.generatedAt.slice(0, 10)}`,
      filename: "nmdpra-license-report.pdf"
    });
    console.log(`Email sent: id=${result.id}`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
