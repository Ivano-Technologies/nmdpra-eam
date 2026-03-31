import { currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { POLICY_VERSION } from "@/lib/compliance-policy";
import { AuthRoleError, requirePermissionServer } from "@/lib/auth";
import {
  hasConsentQuery,
  recordConsentMutation
} from "@/lib/internal-convex-refs";
import { consentOrgIdFromMetadata } from "@/lib/resolve-consent-org";

export const runtime = "nodejs";

const SCOPE = ["terms", "upload"] as const;
type ConsentScope = (typeof SCOPE)[number];

function isScope(s: string): s is ConsentScope {
  return (SCOPE as readonly string[]).includes(s);
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
    console.error("GET /api/consent:", e);
    return NextResponse.json(
      { error: "Failed to load consent status" },
      { status: 500 }
    );
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
    console.error("POST /api/consent:", e);
    return NextResponse.json(
      { error: "Failed to record consent" },
      { status: 500 }
    );
  }
}
