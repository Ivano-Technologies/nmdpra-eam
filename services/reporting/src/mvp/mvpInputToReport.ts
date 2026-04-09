import type { Report } from "@rmlis/report-core/server";

import type { MvpReportInput } from "./renderMvpReport";

const TABLE_ROW_LIMIT = 25;

function normalizeGeneratedAt(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "1970-01-01T00:00:00.000Z";
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    return "1970-01-01T00:00:00.000Z";
  }
  return d.toISOString();
}

/** Maps Convex MVP report data into the institutional Report shape for renderReportToPDF. */
export function mvpInputToReport(data: MvpReportInput): Report {
  const generatedAt = normalizeGeneratedAt(data.generatedAt);
  const s = data.summary;
  const summaryText = [
    `Total licences: ${s.total}.`,
    `Expired: ${s.expired}; critical: ${s.critical}; warning: ${s.warning}; safe: ${s.safe}.`,
    `Expiring in 30 days: ${s.expiringIn30Days}.`
  ].join(" ");

  const tableRows =
    data.rows.length > 0
      ? data.rows.slice(0, TABLE_ROW_LIMIT).map((r) => [
          r.vendor,
          r.licenseType,
          r.expiryDate,
          r.status,
          r.expiryStatus,
          String(r.daysToExpiry)
        ])
      : [
          [
            "No rows returned",
            "—",
            "—",
            "—",
            "—",
            "—"
          ]
        ];

  return {
    meta: {
      title: "NMDPRA Institutional Report",
      generatedAt
    },
    sections: [
      { type: "text", content: summaryText },
      {
        type: "table",
        columns: [
          "Vendor",
          "License type",
          "Expiry",
          "Status",
          "Band",
          "Days to expiry"
        ],
        rows: tableRows
      },
      {
        type: "chart",
        title: "Licence status bands",
        spec: {
          $schema: "https://vega.github.io/schema/vega-lite/v5.json",
          width: 420,
          height: 220,
          data: {
            values: [
              { band: "Expired", value: s.expired },
              { band: "Critical", value: s.critical },
              { band: "Warning", value: s.warning },
              { band: "Safe", value: s.safe }
            ]
          },
          mark: "bar",
          encoding: {
            x: { field: "band", type: "nominal", title: "Band" },
            y: { field: "value", type: "quantitative", title: "Count" },
            color: { field: "band", type: "nominal", legend: null }
          }
        }
      }
    ]
  };
}
