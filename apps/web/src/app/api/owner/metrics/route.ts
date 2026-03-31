import { auth, clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { NextResponse } from "next/server";

import { parseUserRole } from "@/lib/roles";

const metricsOverview = makeFunctionReference<"query">("metrics:overview");

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const self = await client.users.getUser(userId);
  if (parseUserRole(self.publicMetadata) !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const secret = process.env.AUDIT_SECRET?.trim();
  if (!convexUrl || !secret) {
    return NextResponse.json(
      { vendorCount: null, licenseCount: null, error: "Metrics unavailable" },
      { status: 200 }
    );
  }

  try {
    const convex = new ConvexHttpClient(convexUrl);
    const data = await convex.query(metricsOverview, { secret });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("owner metrics API error:", e);
    return NextResponse.json(
      { error: "Failed to load metrics" },
      { status: 500 }
    );
  }
}
