import { currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { POLICY_VERSION } from "@/lib/compliance-policy";
import { AuthRoleError, requirePermissionServer } from "@/lib/auth";
import {
  hasConsentQuery,
  recordConsentMutation,
  userPreferencesGetQuery,
  userPreferencesUpsertMutation
} from "@/lib/internal-convex-refs";
import { consentOrgIdFromMetadata } from "@/lib/resolve-consent-org";
import { appendComplianceAudit } from "@/server/services/convex-compliance";
import type { UserConsentsPreferences } from "@/types/user-preferences";

/**
 * Regulatory + preference consent under `/api/user/consent` (single surface).
 *
 * GET/POST: Convex `consents` table (terms | upload) for compliance records.
 * PATCH: `userPreferences.consents` marketing/terms mirror.
 *
 * HTTP status reference (Network tab):
 * - 401: No Clerk session or missing `currentUser` after auth.
 * - 403: Role below `client` (`requirePermissionServer`).
 * - 400: Invalid `scope` / JSON / `body.scope` (GET/POST) or PATCH body.
 * - 503: Missing env, or Convex rejected the job secret (align Vercel
 *   `INTERNAL_JOB_SECRET` with Convex dashboard → Settings → Environment Variables).
 * - 500: Other Convex/runtime errors (see server logs: CONSENT_GET_ERROR / CONSENT_POST_ERROR).
 *
 * Note: The browser never sends `INTERNAL_JOB_SECRET`; Next.js injects it server-side
 * into Convex calls. There is no `x-internal-secret` header check on this route.
 */
export const runtime = "nodejs";

const SCOPE = ["terms", "upload"] as const;
type ConsentScope = (typeof SCOPE)[number];

function isScope(s: string): s is ConsentScope {
  return (SCOPE as readonly string[]).includes(s);
}

function messageFromUnknown(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  return String(e);
}

/** Convex `assertJobSecret` throws; HTTP client surfaces as Unauthorized / Failed to authenticate. */
function isLikelyConvexSecretMismatch(e: unknown): boolean {
  const m = messageFromUnknown(e);
  return (
    m.includes("Unauthorized") ||
    m.includes("Failed to authenticate") ||
    m.includes("not authenticated")
  );
}

function consentConvexErrorResponse(e: unknown, label: "GET" | "POST") {
  const msg = messageFromUnknown(e);
  console.error(`CONSENT_${label}_ERROR`, msg, e);

  if (isLikelyConvexSecretMismatch(e)) {
    return NextResponse.json(
      {
        error:
          "Consent backend rejected the server credential. Set INTERNAL_JOB_SECRET in Vercel to match your Convex deployment.",
        code: "CONVEX_SECRET_MISMATCH"
      },
      { status: 503 }
    );
  }

  const dev = process.env.NODE_ENV === "development";
  return NextResponse.json(
    {
      error:
        label === "GET"
          ? "Failed to load consent status"
          : "Failed to record consent",
      ...(dev ? { detail: msg } : {})
    },
    { status: 500 }
  );
}

export async function GET(req: Request) {
  try {
    const { userId } = await requirePermissionServer("client");
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const scopeRaw = url.searchParams.get("scope") ?? "terms";
    if (!isScope(scopeRaw)) {
      return NextResponse.json(
        { error: "scope must be terms or upload" },
        { status: 400 }
      );
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
    const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
    if (!convexUrl || !jobSecret) {
      return NextResponse.json(
        { error: "Consent service not configured" },
        { status: 503 }
      );
    }

    const orgId = consentOrgIdFromMetadata(user.publicMetadata);
    const client = new ConvexHttpClient(convexUrl);
    const accepted = await client.query(hasConsentQuery, {
      secret: jobSecret,
      userId,
      orgId,
      version: POLICY_VERSION,
      scope: scopeRaw
    });

    return NextResponse.json(
      {
        accepted: Boolean(accepted),
        version: POLICY_VERSION,
        scope: scopeRaw
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return consentConvexErrorResponse(e, "GET");
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await requirePermissionServer("client");
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const scopeRaw =
      body &&
      typeof body === "object" &&
      "scope" in body &&
      typeof (body as { scope?: unknown }).scope === "string"
        ? (body as { scope: string }).scope
        : "";

    if (!isScope(scopeRaw)) {
      return NextResponse.json(
        { error: "body.scope must be terms or upload" },
        { status: 400 }
      );
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
    const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
    if (!convexUrl || !jobSecret) {
      return NextResponse.json(
        { error: "Consent service not configured" },
        { status: 503 }
      );
    }

    const orgId = consentOrgIdFromMetadata(user.publicMetadata);
    const client = new ConvexHttpClient(convexUrl);
    await client.mutation(recordConsentMutation, {
      secret: jobSecret,
      userId,
      orgId,
      version: POLICY_VERSION,
      scope: scopeRaw
    });

    return NextResponse.json({ success: true, version: POLICY_VERSION });
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return consentConvexErrorResponse(e, "POST");
  }
}

type PatchBody = {
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

    const b = body as PatchBody;
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
