import { NextResponse } from "next/server";

import { AuthRoleError, requirePermissionServer } from "@/lib/auth";
import { ConvexHttpClient } from "convex/browser";
import { userPreferencesRequestDeletionMutation } from "@/lib/internal-convex-refs";
import {
  RateLimitError,
  checkConvexRateLimit
} from "@/server/services/rate-limit-convex";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { userId } = await requirePermissionServer("client");

    try {
      await checkConvexRateLimit({
        key: `${userId}:delete-request`,
        max: 5,
        windowMs: 60 * 60 * 1000
      });
    } catch (e) {
      if (e instanceof RateLimitError) {
        return NextResponse.json(
          { error: "Too many deletion requests. Try again later." },
          { status: 429 }
        );
      }
      throw e;
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Expected JSON object" }, { status: 400 });
    }
    const confirmation = (body as { confirmation?: unknown }).confirmation;
    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { error: 'confirmation must be the string "DELETE"' },
        { status: 400 }
      );
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
    const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
    if (!convexUrl || !jobSecret) {
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 503 }
      );
    }

    const client = new ConvexHttpClient(convexUrl);
    await client.mutation(userPreferencesRequestDeletionMutation, {
      secret: jobSecret,
      userId
    });

    return NextResponse.json({ ok: true, status: "pending" });
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/user/delete-request:", e);
    return NextResponse.json(
      { error: "Failed to record deletion request" },
      { status: 500 }
    );
  }
}
