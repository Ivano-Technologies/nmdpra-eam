import type { NextApiRequest, NextApiResponse } from "next";
import { renderReportToPDF, type Report } from "@rmlis/report-core";
import { ZodError } from "zod";

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

  try {
    const generatedAt = resolveGeneratedAt(req);
    const reportId =
      typeof req.query.reportId === "string" && req.query.reportId.trim()
        ? req.query.reportId.trim()
        : "MVP-STATIC-001";
    const report = buildInstitutionalReport(reportId, generatedAt);

    const pdf = await renderReportToPDF(report);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="rmlis-mvp-report.pdf"'
    );
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(pdf);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: "Invalid report payload",
        code: "REPORT_VALIDATION_ERROR",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      });
      return;
    }
    console.error("GET /api/reports/mvp.pdf:", error);
    res.status(500).json({
      error: "Failed to generate report PDF",
      code: "REPORT_RENDER_FAILED"
    });
  }
}

function resolveGeneratedAt(req: NextApiRequest): string {
  const fromQuery =
    typeof req.query.generatedAt === "string" ? req.query.generatedAt : undefined;
  const fromEnv = process.env.REPORT_FIXED_GENERATED_AT?.trim();
  return (
    fromQuery ??
    fromEnv ??
    "2026-01-01T00:00:00.000Z"
  );
}

function buildInstitutionalReport(reportId: string, generatedAt: string): Report {
  return {
    meta: {
      title: "Institutional Reporting MVP",
      generatedAt
    },
    sections: [
      {
        type: "text",
        content: `Institutional report ${reportId} generated for deterministic E2E validation.`
      },
      {
        type: "table",
        columns: ["Vendor", "Status", "Risk"],
        rows: [
          ["Astra Infrastructure", "Active", "Low"],
          ["Helios Systems", "Warning", "Medium"],
          ["Meridian Labs", "Critical", "High"]
        ]
      },
      {
        type: "chart",
        title: "Risk Distribution Chart",
        spec: {
          $schema: "https://vega.github.io/schema/vega-lite/v5.json",
          width: 420,
          height: 220,
          data: {
            values: [
              { band: "Low", value: 12 },
              { band: "Medium", value: 8 },
              { band: "High", value: 5 }
            ]
          },
          mark: "bar",
          encoding: {
            x: { field: "band", type: "nominal", title: "Risk band" },
            y: { field: "value", type: "quantitative", title: "Licences" },
            color: { field: "band", type: "nominal", legend: null }
          }
        }
      }
    ]
  };
}
