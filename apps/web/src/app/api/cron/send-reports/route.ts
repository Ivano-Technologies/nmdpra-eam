import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { buildComplianceReportHtml } from "@/lib/compliance-report-email";
import { verifyCronRequest } from "@/lib/cron-auth";
import { getResendClient, getResendFromEmail, isResendConfigured } from "@/lib/resend";
import {
  listSubscriptionsQuery,
  mvpReportDataQuery,
  setLastSentMutation
} from "@/lib/internal-convex-refs";
import {
  decisionToLegacyEmailAllow,
  shouldSendNotification
} from "@/server/notifications/policy";
import type { MvpReportResponse } from "@/types/api";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Minimum time between emails per subscription (MVP daily throttle). */
const MIN_INTERVAL_MS = 22 * 60 * 60 * 1000;

async function handleSendReports(req: Request) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isResendConfigured()) {
    return NextResponse.json(
      {
        error:
          "Resend not configured (RESEND_API_KEY, RESEND_FROM_EMAIL or MOCK_RESEND=1)"
      },
      { status: 503 }
    );
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
  if (!convexUrl || !jobSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const client = new ConvexHttpClient(convexUrl);
  const subs = await client.query(listSubscriptionsQuery, { secret: jobSecret });
  const resend = getResendClient();
  const from = getResendFromEmail();
  const now = Date.now();
  let sent = 0;
  const errors: string[] = [];

  for (const sub of subs) {
    if (sub.lastSentAt && now - sub.lastSentAt < MIN_INTERVAL_MS) {
      continue;
    }

    try {
      const decision = shouldSendNotification(
        null,
        { type: "scheduled_report" },
        new Date(now)
      );
      const policy = decisionToLegacyEmailAllow(decision);
      if (!policy.allow) {
        errors.push(`${sub.email}: policy:${policy.reason}`);
        continue;
      }

      const report = (await client.query(mvpReportDataQuery, {
        orgIdFilter: sub.orgId,
        includeUnscopedVendors: false
      })) as MvpReportResponse;

      const html = buildComplianceReportHtml(sub.orgId, report);
      const { error } = await resend.emails.send({
        from,
        to: sub.email,
        subject: `Ivano IQ compliance report — ${sub.orgId}`,
        html
      });

      if (error) {
        errors.push(`${sub.email}: ${JSON.stringify(error)}`);
        continue;
      }

      await client.mutation(setLastSentMutation, {
        secret: jobSecret,
        subscriptionId: sub.id,
        lastSentAt: now
      });
      sent += 1;
    } catch (e) {
      errors.push(
        `${sub.email}: ${e instanceof Error ? e.message : "unknown"}`
      );
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    skipped: subs.length - sent - errors.length,
    errors: errors.length > 0 ? errors : undefined
  });
}

/** Vercel Cron invokes scheduled routes with GET. */
export async function GET(req: Request) {
  return handleSendReports(req);
}

export async function POST(req: Request) {
  return handleSendReports(req);
}
