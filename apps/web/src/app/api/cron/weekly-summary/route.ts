import { clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { POWERED_BY_LINE } from "@/lib/brand";
import { verifyCronRequest } from "@/lib/cron-auth";
import { isResendConfigured } from "@/lib/resend";
import { getAppOrigin } from "@/lib/app-origin";
import {
  userPreferencesListDigestForPolicyQuery,
  userPreferencesSetLastNotifiedAtMutation
} from "@/lib/internal-convex-refs";
import { createInAppNotification } from "@/server/notifications/in-app";
import { sendWeeklyEmail } from "@/server/notifications/email";
import { shouldSendNotification } from "@/server/notifications/policy";
import type { PolicyUserPreferences } from "@/server/notifications/policy";
import type { DigestPreferences } from "@/types/user-preferences";

export const runtime = "nodejs";
export const maxDuration = 300;

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

type PolicyRow = {
  userId: string;
  orgId?: string;
  digest: unknown;
  consents: unknown;
  lastNotifiedAt?: number;
  weeklySummarySnippet?: string;
};

function buildWeeklyHtml(snippet: string | undefined, fallbackLine: string): string {
  const origin = getAppOrigin();
  const reviewUrl = `${origin}/dashboard#section-weekly-insight`;
  const main =
    snippet && snippet.trim().length > 0 ? snippet : fallbackLine;
  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,-apple-system,sans-serif;color:#1c1816;line-height:1.5;max-width:560px">
  <h2 style="margin:0 0 12px;font-size:22px;font-weight:600">Weekly Summary</h2>
  <p style="margin:0 0 20px;color:#374151;font-size:15px">${escapeHtml(main)}</p>
  <p style="margin:0"><a href="${reviewUrl}" style="color:#deaf5f;font-weight:600;text-decoration:none">Review now →</a></p>
  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af">Ivano IQ — Operational Intelligence for Enterprise Infrastructure</p>
  <p style="margin:12px 0 0;font-size:11px;color:#57534e;letter-spacing:0.06em;text-transform:uppercase">${escapeHtml(POWERED_BY_LINE)}</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(req: Request) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
  if (!convexUrl || !jobSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const fromConfigured = isResendConfigured();

  const client = new ConvexHttpClient(convexUrl);
  const rows = (await client.query(userPreferencesListDigestForPolicyQuery, {
    secret: jobSecret,
    limit: 200
  })) as PolicyRow[];

  const now = Date.now();
  const nowDate = new Date(now);
  let sentEmail = 0;
  let sentInApp = 0;
  let skipped = 0;
  const reasons: Record<string, number> = {};
  let rateLimited = 0;
  const errors: string[] = [];

  const clerk = await clerkClient();

  for (const row of rows) {
    const prefs: PolicyUserPreferences = {
      digest: row.digest as DigestPreferences | undefined,
      consents: row.consents as PolicyUserPreferences["consents"]
    };

    const decision = shouldSendNotification(
      prefs,
      { type: "weekly_summary" },
      nowDate
    );

    console.log(
      JSON.stringify({
        level: "info",
        event: "NOTIFICATION_DECISION",
        userId: row.userId,
        decision
      })
    );

    if (!decision.send) {
      skipped += 1;
      const r = decision.reason ?? "unknown";
      reasons[r] = (reasons[r] ?? 0) + 1;
      continue;
    }

    if (
      row.lastNotifiedAt !== undefined &&
      now - row.lastNotifiedAt < SIX_HOURS_MS
    ) {
      rateLimited += 1;
      console.log(
        JSON.stringify({
          level: "info",
          event: "NOTIFICATION_DECISION",
          userId: row.userId,
          decision: { send: false, reason: "rate_limited" }
        })
      );
      continue;
    }

    try {
      if (decision.channel === "email") {
        if (!fromConfigured) {
          errors.push(`${row.userId}: Resend not configured`);
          continue;
        }
        const user = await clerk.users.getUser(row.userId);
        const primary = user.primaryEmailAddressId;
        const email =
          user.emailAddresses.find((e) => e.id === primary)?.emailAddress ??
          user.emailAddresses[0]?.emailAddress;
        if (!email) {
          errors.push(`${row.userId}: no email`);
          continue;
        }

        const html = buildWeeklyHtml(
          row.weeklySummarySnippet,
          "Your licence portfolio has updates this week — open the dashboard for expiries, risk, and reports."
        );
        await sendWeeklyEmail({
          to: email,
          subject: "Ivano IQ — Weekly Compliance Summary",
          html
        });
        await client.mutation(userPreferencesSetLastNotifiedAtMutation, {
          secret: jobSecret,
          userId: row.userId,
          lastNotifiedAt: now
        });
        sentEmail += 1;
      } else if (decision.channel === "in_app") {
        const body =
          row.weeklySummarySnippet && row.weeklySummarySnippet.trim().length > 0
            ? row.weeklySummarySnippet
            : "Your weekly compliance summary is ready — open the dashboard for details.";
        await createInAppNotification(client, {
          secret: jobSecret,
          userId: row.userId,
          title: "Weekly summary",
          body,
          kind: "weekly_summary"
        });
        await client.mutation(userPreferencesSetLastNotifiedAtMutation, {
          secret: jobSecret,
          userId: row.userId,
          lastNotifiedAt: now
        });
        sentInApp += 1;
      }
    } catch (e) {
      errors.push(
        `${row.userId}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  return NextResponse.json({
    ok: true,
    evaluated: rows.length,
    sentEmail,
    sentInApp,
    skipped,
    rateLimited,
    reasons,
    errors: errors.length > 0 ? errors : undefined
  });
}
