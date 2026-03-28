import type { Request, Response } from "express";
import { Resend } from "resend";

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
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const toRaw = typeof req.body?.to === "string" ? req.body.to.trim() : "";
  const to = toRaw || process.env.REPORT_EMAIL_TO?.trim() || "";

  if (!apiKey || !from) {
    res.status(503).json({
      error: "Email not configured (RESEND_API_KEY, RESEND_FROM_EMAIL)",
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

  const resend = new Resend(apiKey);
  const { data: sent, error } = await resend.emails.send({
    from,
    to,
    subject: `RMLIS license report — ${data.generatedAt.slice(0, 10)}`,
    text: "Attached: Regulatory Monitoring & License Intelligence MVP report (PDF).",
    attachments: [{ filename: "rmlis-mvp-report.pdf", content: pdf }]
  });

  if (error) {
    res.status(502).json({ error: error.message, code: "EMAIL_SEND_FAILED" });
    return;
  }

  res.status(200).json({ ok: true, id: sent?.id ?? null });
};
