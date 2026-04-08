import type { NextApiRequest, NextApiResponse } from "next";
import { buildMvpPdf } from "@rmlis/reporting/mvp";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const mvpReportDataQuery = makeFunctionReference<"query">(
  "licenses:mvpReportData"
);

export const config = {
  api: {
    bodyParser: false
  }
};

/**
 * PDF when `BACKEND_API_ORIGIN` is unset (no rewrite to Express).
 * Mirrors {@link apps/api/src/controllers/reportController.ts} `getMvpPdf`.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!convexUrl) {
    res.status(503).json({
      error: "Convex not configured",
      code: "SERVICE_UNAVAILABLE"
    });
    return;
  }

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

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="rmlis-mvp-report.pdf"'
    );
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(pdf);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Convex query failed";
    res.status(503).json({ error: message, code: "SERVICE_UNAVAILABLE" });
  }
}
