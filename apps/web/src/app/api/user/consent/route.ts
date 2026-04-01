import { NextResponse } from "next/server";

import { AuthRoleError, requirePermissionServer } from "@/lib/auth";
import { appendComplianceAudit } from "@/server/services/convex-compliance";
import { ConvexHttpClient } from "convex/browser";
import {
  userPreferencesGetQuery,
  userPreferencesUpsertMutation
} from "@/lib/internal-convex-refs";
import type { UserConsentsPreferences } from "@/types/user-preferences";

export const runtime = "nodejs";

type Body = {
  marketingEmails?: boolean;
  productUpdates?: boolean;
  termsAcceptedAt?: number;
  termsVersion?: string;
};

export async function PATCH(req: Request) {
  try {
    const { userId } = await requirePermissionServer("client");
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Expected JSON object" }, { status: 400 });
    }

    const b = body as Body;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
    const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
    if (!convexUrl || !jobSecret) {
      return NextResponse.json(
        { error: "Preferences not configured" },
        { status: 503 }
      );
    }

    const consentUpdatedAt = Date.now();
    const consents: UserConsentsPreferences = {
      consentUpdatedAt
    };
    if (b.marketingEmails !== undefined) {
      consents.marketingEmails = b.marketingEmails;
    }
    if (b.productUpdates !== undefined) {
      consents.productUpdates = b.productUpdates;
    }
    if (b.termsAcceptedAt !== undefined) {
      consents.termsAcceptedAt = b.termsAcceptedAt;
    }
    if (b.termsVersion !== undefined) {
      consents.termsVersion = b.termsVersion;
    }

    const client = new ConvexHttpClient(convexUrl);
    await client.mutation(userPreferencesUpsertMutation, {
      secret: jobSecret,
      userId,
      patch: { consents }
    });

    await appendComplianceAudit({
      action: "CONSENT_UPDATED",
      actorUserId: userId,
      metadata: { consents }
    });

    const doc = await client.query(userPreferencesGetQuery, {
      secret: jobSecret,
      userId
    });

    return NextResponse.json({
      ok: true,
      preferences: doc
        ? {
            version: doc.version,
            consents: doc.consents,
            deletion: doc.deletion,
            dashboardLayout: doc.dashboardLayout,
            onboardingSteps: doc.onboardingSteps,
            savedViews: doc.savedViews,
            digest: doc.digest,
            milestones: doc.milestones,
            weeklySummarySnippet: doc.weeklySummarySnippet,
            weeklySummaryAt: doc.weeklySummaryAt,
            updatedAt: doc.updatedAt
          }
        : null
    });
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PATCH /api/user/consent:", e);
    return NextResponse.json(
      { error: "Failed to save consent preferences" },
      { status: 500 }
    );
  }
}
