import { NextResponse } from "next/server";

import { mvpReportDataQuery } from "@/lib/internal-convex-refs";
import { runLicenseAdminQuery } from "@/lib/run-license-admin-query";

export const dynamic = "force-dynamic";

/** Mirrors legacy Express `GET /api/licenses/mvp-report` (raw JSON body). */
export async function GET() {
  const result = await runLicenseAdminQuery(async ({ convex, scope }) => {
    return convex.query(mvpReportDataQuery, scope);
  });
  if (result instanceof NextResponse) {
    return result;
  }
  try {
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (e) {
    console.error("GET /api/licenses/mvp-report:", e);
    return NextResponse.json(
      { error: "Failed to load report", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }
}
