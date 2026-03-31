import { clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { NextResponse } from "next/server";

import { AuthRoleError, requirePermissionServer } from "@/lib/auth";
import type { Role } from "@/lib/roles";
import { getLicenseQueryScope } from "@/lib/tenant";

const riskRankingQuery = makeFunctionReference<"query">("licenses:riskRanking");

function formatIsoDateEnGb(isoDate: string): string {
  const parts = isoDate.trim().split("-");
  if (parts.length !== 3) {
    return isoDate;
  }
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) {
    return isoDate;
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-GB", { timeZone: "UTC" });
}

export async function GET() {
  let userId: string;
  let role: Role;
  try {
    ({ userId, role } = await requirePermissionServer("admin"));
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!convexUrl) {
    return NextResponse.json(
      { error: "Failed to load risk ranking" },
      { status: 500 }
    );
  }

  try {
    const clerk = await clerkClient();
    const self = await clerk.users.getUser(userId);
    let scope: ReturnType<typeof getLicenseQueryScope>;
    try {
      scope = getLicenseQueryScope(self.publicMetadata, role);
    } catch (e) {
      if (e instanceof AuthRoleError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      throw e;
    }
    const convex = new ConvexHttpClient(convexUrl);
    const rows = (await convex.query(riskRankingQuery, scope)) as Array<{
      vendorName: string;
      licenseType: string;
      expiryDate: string;
      riskScore: number;
      daysToExpiry: number;
    }>;
    const body = rows.map((r) => ({
      ...r,
      expiryDateEnGb: formatIsoDateEnGb(r.expiryDate)
    }));
    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("risk-ranking API error:", e);
    return NextResponse.json(
      { error: "Failed to load risk ranking" },
      { status: 500 }
    );
  }
}
