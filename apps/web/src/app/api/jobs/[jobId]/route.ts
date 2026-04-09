import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { AuthRoleError, requirePermissionServer } from "@/lib/auth";
import { backgroundJobsGetQuery } from "@/lib/internal-convex-refs";

export const dynamic = "force-dynamic";

type JobRow = {
  jobId: string;
  status: "processing" | "complete" | "failed";
  result?: unknown;
  error?: string;
  kind?: string;
  createdAt: number;
  updatedAt: number;
} | null;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ jobId: string }> }
): Promise<NextResponse> {
  const { jobId } = await ctx.params;
  if (!jobId || !jobId.trim()) {
    return NextResponse.json(
      { error: "Missing jobId", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  let userId: string;
  try {
    ({ userId } = await requirePermissionServer("admin"));
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json(
        { error: e.message, code: "FORBIDDEN" },
        { status: e.status }
      );
    }
    throw e;
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
  if (!convexUrl || !jobSecret) {
    return NextResponse.json(
      { error: "Not configured", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const client = new ConvexHttpClient(convexUrl);
  const row = (await client.query(backgroundJobsGetQuery, {
    secret: jobSecret,
    userId,
    jobId: jobId as never
  })) as JobRow;

  if (!row) {
    return NextResponse.json(
      { error: "Job not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    jobId: String(row.jobId),
    status: row.status,
    result: row.result,
    error: row.error
  });
}
