import { auth, clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { NextResponse } from "next/server";

import { parseUserRole } from "@/lib/roles";

const auditListQuery = makeFunctionReference<"query">("audit:list");

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const self = await client.users.getUser(userId);
  if (parseUserRole(self.publicMetadata) !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.min(100, Math.max(1, Number(limitRaw) || 50));

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const secret = process.env.AUDIT_SECRET?.trim();
  if (!convexUrl || !secret) {
    return NextResponse.json(
      { error: "Audit logs are not configured" },
      { status: 503 }
    );
  }

  try {
    const convex = new ConvexHttpClient(convexUrl);
    const entries = await convex.query(auditListQuery, { secret, limit });
    return NextResponse.json({ entries }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("audit-logs API error:", e);
    return NextResponse.json(
      { error: "Failed to load audit logs" },
      { status: 500 }
    );
  }
}
