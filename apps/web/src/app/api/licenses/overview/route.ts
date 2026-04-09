import { NextResponse } from "next/server";

import { runLicenseAdminQuery } from "@/lib/run-license-admin-query";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await runLicenseAdminQuery(async () => {
    return {
      message:
        "License overview (Convex-backed data available via /api/licenses/expiring)",
      generatedAt: new Date().toISOString()
    };
  });
  if (result instanceof NextResponse) {
    return result;
  }
  return NextResponse.json(result);
}
