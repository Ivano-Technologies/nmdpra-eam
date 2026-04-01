import { NextResponse } from "next/server";

import { AuthRoleError, requirePermissionServer } from "@/lib/auth";
import { ConvexHttpClient } from "convex/browser";
import {
  dataExportsCreateMutation,
  dataExportsFinalizeMutation,
  dataExportsGetQuery
} from "@/lib/internal-convex-refs";
import {
  RateLimitError,
  checkConvexRateLimit
} from "@/server/services/rate-limit-convex";

export const runtime = "nodejs";

export async function POST() {
  try {
    const { userId } = await requirePermissionServer("client");

    try {
      await checkConvexRateLimit({
        key: `${userId}:export`,
        max: 10,
        windowMs: 60 * 60 * 1000
      });
    } catch (e) {
      if (e instanceof RateLimitError) {
        return NextResponse.json(
          { error: "Too many export requests. Try again later." },
          { status: 429 }
        );
      }
      throw e;
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
    const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
    if (!convexUrl || !jobSecret) {
      return NextResponse.json(
        { error: "Export not configured" },
        { status: 503 }
      );
    }

    const client = new ConvexHttpClient(convexUrl);
    const exportId = await client.mutation(dataExportsCreateMutation, {
      secret: jobSecret,
      userId
    });

    return NextResponse.json({
      ok: true,
      exportId,
      status: "pending",
      message:
        "Poll GET /api/user/export?id=… to run stub finalize and load ready payload."
    });
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/user/export:", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await requirePermissionServer("client");
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing id query parameter" },
        { status: 400 }
      );
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
    const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
    if (!convexUrl || !jobSecret) {
      return NextResponse.json(
        { error: "Export not configured" },
        { status: 503 }
      );
    }

    const client = new ConvexHttpClient(convexUrl);
    let row = await client.query(dataExportsGetQuery, {
      secret: jobSecret,
      userId,
      exportId: id
    });

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (row.status === "pending") {
      await client.mutation(dataExportsFinalizeMutation, {
        secret: jobSecret,
        userId,
        exportId: id
      });
      row = await client.query(dataExportsGetQuery, {
        secret: jobSecret,
        userId,
        exportId: id
      });
      if (!row) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ ok: true, export: row });
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/user/export:", e);
    return NextResponse.json({ error: "Failed to load export" }, { status: 500 });
  }
}
