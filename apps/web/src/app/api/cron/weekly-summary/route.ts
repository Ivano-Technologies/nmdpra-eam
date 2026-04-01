import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { verifyCronRequest } from "@/lib/cron-auth";
import { shouldSendNotification } from "@/lib/notification-policy";
import { userPreferencesListDigestForPolicyQuery } from "@/lib/internal-convex-refs";
import type { DigestPreferences } from "@/types/user-preferences";

export const runtime = "nodejs";

/**
 * Weekly slot (Phase 3): evaluates `shouldSendNotification` for each user's digest.
 * Does not send mail yet — returns aggregate counts for ops visibility.
 * Phase 3+ notification dispatcher will reuse the same policy helper.
 */
export async function GET(req: Request) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
  if (!convexUrl || !jobSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const client = new ConvexHttpClient(convexUrl);
  const rows = (await client.query(userPreferencesListDigestForPolicyQuery, {
    secret: jobSecret,
    limit: 200
  })) as Array<{ userId: string; digest: unknown }>;

  const now = Date.now();
  let wouldSend = 0;
  let wouldSkip = 0;
  const reasons: Record<string, number> = {};

  for (const row of rows) {
    const result = shouldSendNotification({
      digest: row.digest as DigestPreferences | undefined,
      type: "weekly_summary",
      timestampMs: now
    });
    if (result.allow) {
      wouldSend += 1;
    } else {
      wouldSkip += 1;
      reasons[result.reason] = (reasons[result.reason] ?? 0) + 1;
    }
  }

  return NextResponse.json({
    ok: true,
    evaluated: rows.length,
    wouldSend,
    wouldSkip,
    reasons,
    note: "Policy evaluation only; no emails sent. Use the same shouldSendNotification in the dispatcher."
  });
}
