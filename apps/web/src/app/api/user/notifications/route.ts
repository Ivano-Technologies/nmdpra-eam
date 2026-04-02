import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { AuthRoleError, requirePermissionServer } from "@/lib/auth";
import {
  notificationsListForUserQuery,
  notificationsMarkAllReadMutation,
  notificationsMarkReadMutation
} from "@/lib/internal-convex-refs";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await requirePermissionServer("client");
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
    const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
    if (!convexUrl || !jobSecret) {
      return NextResponse.json(
        { error: "Notifications not configured" },
        { status: 503 }
      );
    }
    const client = new ConvexHttpClient(convexUrl);
    const result = await client.query(notificationsListForUserQuery, {
      secret: jobSecret,
      userId,
      limit: 25
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/user/notifications:", e);
    return NextResponse.json(
      { error: "Failed to load notifications" },
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
        { error: "Notifications not configured" },
        { status: 503 }
      );
    }
    const client = new ConvexHttpClient(convexUrl);

    const markAllRead = (body as { markAllRead?: boolean }).markAllRead === true;
    const notificationId = (body as { notificationId?: string }).notificationId;

    if (markAllRead) {
      await client.mutation(notificationsMarkAllReadMutation, {
        secret: jobSecret,
        userId
      });
      return NextResponse.json({ ok: true });
    }

    if (typeof notificationId === "string" && notificationId.length > 0) {
      await client.mutation(notificationsMarkReadMutation, {
        secret: jobSecret,
        userId,
        notificationId: notificationId as never
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "Expected markAllRead: true or notificationId" },
      { status: 400 }
    );
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PATCH /api/user/notifications:", e);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
