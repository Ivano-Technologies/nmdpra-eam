import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { AuthRoleError, requirePermissionServer } from "@/lib/auth";
import {
  userPreferencesGetQuery,
  userPreferencesUpsertMutation
} from "@/lib/internal-convex-refs";
import type { UserPreferencesDoc } from "@/types/user-preferences";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await requirePermissionServer("client");
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
    const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
    if (!convexUrl || !jobSecret) {
      return NextResponse.json(
        { error: "Preferences not configured" },
        { status: 503 }
      );
    }
    const client = new ConvexHttpClient(convexUrl);
    const doc = await client.query(userPreferencesGetQuery, {
      secret: jobSecret,
      userId
    });
    return NextResponse.json(
      {
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
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/user/preferences:", e);
    return NextResponse.json(
      { error: "Failed to load preferences" },
      { status: 500 }
    );
  }
}

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

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
    const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
    if (!convexUrl || !jobSecret) {
      return NextResponse.json(
        { error: "Preferences not configured" },
        { status: 503 }
      );
    }

    const patch = body as Partial<UserPreferencesDoc> & {
      orgId?: string;
    };

    const client = new ConvexHttpClient(convexUrl);
    await client.mutation(userPreferencesUpsertMutation, {
      secret: jobSecret,
      userId,
      orgId: patch.orgId,
      patch
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
    console.error("PATCH /api/user/preferences:", e);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
