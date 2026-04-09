import { formatIsoDateEnGb } from "@rmlis/shared";
import { NextResponse } from "next/server";

import { listAllForCsvQuery } from "@/lib/internal-convex-refs";
import { runLicenseAdminQuery } from "@/lib/run-license-admin-query";

export const dynamic = "force-dynamic";

const escapeCsvCell = (value: string): string => {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export async function GET() {
  const result = await runLicenseAdminQuery(async ({ convex, scope }) => {
    return convex.query(listAllForCsvQuery, scope);
  });
  if (result instanceof NextResponse) {
    return result;
  }

  const rows = result as Array<{
    vendorName: string;
    licenseType: string;
    issueDate: string;
    expiryDate: string;
    status: string;
    riskScore: number;
    daysToExpiry: number;
    expiryStatus: string;
  }>;

  const header = [
    "vendorName",
    "licenseType",
    "issueDate",
    "expiryDate",
    "status",
    "riskScore",
    "daysToExpiry",
    "expiryStatus"
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        escapeCsvCell(row.vendorName),
        escapeCsvCell(row.licenseType),
        escapeCsvCell(formatIsoDateEnGb(row.issueDate)),
        escapeCsvCell(formatIsoDateEnGb(row.expiryDate)),
        escapeCsvCell(row.status),
        escapeCsvCell(String(row.riskScore)),
        escapeCsvCell(String(row.daysToExpiry)),
        escapeCsvCell(String(row.expiryStatus))
      ].join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="licenses.csv"',
      "Cache-Control": "no-store"
    }
  });
}
