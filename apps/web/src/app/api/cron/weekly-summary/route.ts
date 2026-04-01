import { NextResponse } from "next/server";

import { verifyCronRequest } from "@/lib/cron-auth";

export const runtime = "nodejs";

/**
 * Placeholder for a weekly org-wide summary (e.g. write `weeklySummarySnippet`
 * into Convex `userPreferences` per org owner). Wire to Convex batch jobs when
 * you need persisted copy; the dashboard already shows a live snapshot banner.
 */
export async function GET(req: Request) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    message:
      "Weekly summary cron acknowledged. Extend with Convex mutations to populate weeklySummarySnippet."
  });
}
