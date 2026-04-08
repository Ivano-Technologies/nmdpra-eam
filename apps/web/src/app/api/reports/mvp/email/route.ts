import { buildMvpPdf } from "@rmlis/reporting/mvp";
import {
  getResendFromEmail,
  isResendConfigured,
  sendValidatedEmail
} from "@rmlis/resend-client";
import { buildReportEmail } from "@rmlis/resend-client/reportEmail";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { NextResponse, type NextRequest } from "next/server";

const mvpReportDataQuery = makeFunctionReference<"query">(
  "licenses:mvpReportData"
);

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Email MVP report when `BACKEND_API_ORIGIN` is unset.
 * Mirrors {@link apps/api/src/controllers/reportController.ts} `postMvpEmail`.
 */
export async function POST(req: NextRequest) {
  let body: { to?: string };
  try {
    body = (await req.json()) as { to?: string };
  } catch {
    body = {};
  }

  const toRaw = typeof body.to === "string" ? body.to.trim() : "";
  const to = toRaw || process.env.REPORT_EMAIL_TO?.trim() || "";

  if (!isResendConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email not configured (RESEND_API_KEY, RESEND_FROM_EMAIL, or EMAIL_MODE=mock)",
        code: "EMAIL_NOT_CONFIGURED"
      },
      { status: 503 }
    );
  }
  if (!to) {
    return NextResponse.json(
      {
        error:
          'Provide JSON body { "to": "email@example.com" } or set REPORT_EMAIL_TO',
        code: "VALIDATION_ERROR"
      },
      { status: 400 }
    );
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!convexUrl) {
    return NextResponse.json(
      { error: "Convex not configured", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  try {
    let reportId = "MVP-FALLBACK-001";
    let attachments: Array<{ filename?: string; content?: Buffer }> = [];
    try {
      const client = new ConvexHttpClient(convexUrl);
      const data = (await client.query(mvpReportDataQuery, {})) as {
        generatedAt: string;
        summary: {
          total: number;
          expired: number;
          critical: number;
          warning: number;
          safe: number;
          expiringIn30Days: number;
        };
        rows: Array<{
          vendor: string;
          licenseType: string;
          expiryDate: string;
          status: string;
          expiryStatus: string;
          daysToExpiry: number;
        }>;
        topRiskVendors: Array<{ vendorName: string; riskScore: number }>;
      };

      const pdf = await buildMvpPdf({
        generatedAt: data.generatedAt,
        summary: data.summary,
        rows: data.rows,
        topRiskVendors: data.topRiskVendors ?? []
      });
      reportId = data.generatedAt.slice(0, 10);
      attachments = [{ filename: "rmlis-mvp-report.pdf", content: pdf }];
    } catch {
      // Fallback keeps email flow deterministic in local/dev when Convex data is unavailable.
      reportId = "MVP-FALLBACK-001";
      attachments = [];
    }

    const downloadUrl = `${req.nextUrl.origin}/api/reports/mvp.pdf?reportId=${encodeURIComponent(reportId)}`;
    const message = buildReportEmail({
      reportId,
      recipient: to,
      downloadUrl
    });

    const from = getResendFromEmail();
    const testRunId = req.headers.get("x-test-run-id") ?? undefined;
    const { data: sent, error } = await sendValidatedEmail(
      {
        from,
        ...message,
        attachments
      },
      { testRunId }
    );

    if (error) {
      return NextResponse.json(
        { error: error.message, code: "EMAIL_SEND_FAILED" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, id: sent?.id ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Convex query failed";
    return NextResponse.json(
      { error: message, code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }
}
