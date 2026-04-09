import type { ExpiryStatus } from "@rmlis/shared";
import { formatIsoDateEnGb } from "@rmlis/shared";
import { NextResponse } from "next/server";

import { expiringBucketsQuery } from "@/lib/internal-convex-refs";
import { runLicenseAdminQuery } from "@/lib/run-license-admin-query";

export const dynamic = "force-dynamic";

type ExpiringLicense = {
  id: string;
  vendorName: string;
  licenseType: string;
  issueDate: string;
  expiryDate: string;
  issueDateEnGb: string;
  expiryDateEnGb: string;
  status: string;
  daysToExpiry: number;
  expiryStatus: ExpiryStatus;
  riskScore: number;
};

const mapBucket = (rows: unknown[]): ExpiringLicense[] => {
  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    const issueDate = String(r.issueDate);
    const expiryDate = String(r.expiryDate);
    return {
      id: String(r.id),
      vendorName: String(r.vendorName ?? "Unknown vendor"),
      licenseType: String(r.licenseType),
      issueDate,
      expiryDate,
      issueDateEnGb: formatIsoDateEnGb(issueDate),
      expiryDateEnGb: formatIsoDateEnGb(expiryDate),
      status: String(r.status),
      daysToExpiry: Number(r.daysToExpiry),
      expiryStatus: r.expiryStatus as ExpiryStatus,
      riskScore: Number(r.riskScore)
    };
  });
};

export async function GET() {
  const result = await runLicenseAdminQuery(async ({ convex, scope }) => {
    const data = await convex.query(expiringBucketsQuery, scope);
    const d = data as { expired: unknown[]; critical: unknown[]; warning: unknown[] };
    return {
      expired: mapBucket(d.expired),
      critical: mapBucket(d.critical),
      warning: mapBucket(d.warning)
    };
  });
  if (result instanceof NextResponse) {
    return result;
  }
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
