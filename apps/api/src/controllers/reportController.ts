import type { Request, Response } from "express";
import {
  getResendFromEmail,
  isResendConfigured,
  sendValidatedEmail
} from "@rmlis/resend-client";
import { buildReportEmail } from "@rmlis/resend-client/reportEmail";

import { buildMvpPdf } from "@rmlis/reporting/mvp";

import { getMvpReportData } from "../services/licenseService";

export const getMvpPdf = async (_req: Request, res: Response): Promise<void> => {
  let data;
  try {
    data = await getMvpReportData();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Convex query failed";
    res.status(503).json({ error: message, code: "SERVICE_UNAVAILABLE" });
    return;
  }
  let pdf: Buffer;
  try {
    pdf = await buildMvpPdf({
      generatedAt: data.generatedAt,
      summary: data.summary,
      rows: data.rows,
      topRiskVendors: data.topRiskVendors ?? []
    });
  } catch (error) {
    const safeError =
      process.env.VERCEL || process.env.NODE_ENV === "production"
        ? "PDF generation failed"
        : error instanceof Error
          ? error.message
          : "PDF generation failed";
    res.status(500).json({ error: safeError, code: "PDF_FAILED" });
    return;
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="rmlis-mvp-report.pdf"');
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(pdf);
};

export const postMvpEmail = async (req: Request, res: Response): Promise<void> => {
  const toRaw = typeof req.body?.to === "string" ? req.body.to.trim() : "";
  const to = toRaw || process.env.REPORT_EMAIL_TO?.trim() || "";

  if (!isResendConfigured()) {
    res.status(503).json({
      error: "Email not configured (RESEND_API_KEY, RESEND_FROM_EMAIL, or EMAIL_MODE=mock)",
      code: "EMAIL_NOT_CONFIGURED"
    });
    return;
  }
  if (!to) {
    res.status(400).json({
      error: 'Provide JSON body { "to": "email@example.com" } or set REPORT_EMAIL_TO',
      code: "VALIDATION_ERROR"
    });
    return;
  }

  let data;
  try {
    data = await getMvpReportData();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Convex query failed";
    res.status(503).json({ error: message, code: "SERVICE_UNAVAILABLE" });
    return;
  }
  let pdf: Buffer;
  try {
    pdf = await buildMvpPdf({
      generatedAt: data.generatedAt,
      summary: data.summary,
      rows: data.rows,
      topRiskVendors: data.topRiskVendors ?? []
    });
  } catch (error) {
    const safeError =
      process.env.VERCEL || process.env.NODE_ENV === "production"
        ? "PDF generation failed"
        : error instanceof Error
          ? error.message
          : "PDF generation failed";
    res.status(500).json({ error: safeError, code: "PDF_FAILED" });
    return;
  }

  const from = getResendFromEmail();
  const reportId = data.generatedAt.slice(0, 10);
  const origin = `${req.protocol}://${req.get("host")}`;
  const message = buildReportEmail({
    reportId,
    recipient: to,
    downloadUrl: `${origin}/api/reports/mvp.pdf?reportId=${encodeURIComponent(reportId)}`
  });
  const testRunIdHeader =
    typeof req.headers["x-test-run-id"] === "string"
      ? req.headers["x-test-run-id"]
      : undefined;
  const { data: sent, error } = await sendValidatedEmail(
    {
      from,
      ...message,
      attachments: [{ filename: "rmlis-mvp-report.pdf", content: pdf }]
    },
    { testRunId: testRunIdHeader }
  );

  if (error) {
    res.status(502).json({ error: error.message, code: "EMAIL_SEND_FAILED" });
    return;
  }

  res.status(200).json({ ok: true, id: sent?.id ?? null });
};
