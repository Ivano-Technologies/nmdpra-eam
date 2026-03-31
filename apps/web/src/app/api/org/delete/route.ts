import { currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { appendAuditLog } from "@/lib/audit-server";
import { deleteBlobsForOrgPrefix } from "@/lib/blob-delete-org";
import { AuthRoleError, requirePermissionServer } from "@/lib/auth";
import { deleteOrgDataMutation } from "@/lib/internal-convex-refs";
import { resolveUploadOrgId } from "@/lib/resolve-upload-org";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { userId } = await requirePermissionServer("owner");

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

    const confirmPhrase =
      body &&
      typeof body === "object" &&
      "confirmPhrase" in body &&
      typeof (body as { confirmPhrase?: unknown }).confirmPhrase === "string"
        ? (body as { confirmPhrase: string }).confirmPhrase.trim()
        : "";

    if (confirmPhrase !== "DELETE") {
      return NextResponse.json(
        { error: 'Confirmation must be the string "DELETE"' },
        { status: 400 }
      );
    }

    const formOrgId =
      body &&
      typeof body === "object" &&
      "orgId" in body &&
      typeof (body as { orgId?: unknown }).orgId === "string"
        ? (body as { orgId: string }).orgId
        : undefined;

    const resolved = resolveUploadOrgId({
      role: "owner",
      metadata: user.publicMetadata,
      formOrgId
    });
    if (!resolved.ok) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status ?? 400 }
      );
    }
    const { orgId } = resolved;

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
    const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
    if (!convexUrl || !jobSecret) {
      return NextResponse.json(
        { error: "Server is not configured for data deletion" },
        { status: 503 }
      );
    }

    const client = new ConvexHttpClient(convexUrl);
    const counts = await client.mutation(deleteOrgDataMutation, {
      secret: jobSecret,
      orgId
    });

    const blobsDeleted = await deleteBlobsForOrgPrefix(orgId);

    await appendAuditLog({
      action: "org.data_purged",
      actorUserId: userId,
      metadata: {
        orgId,
        ...counts,
        blobsDeleted
      }
    });

    return NextResponse.json({
      success: true,
      orgId,
      ...counts,
      blobsDeleted
    });
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/org/delete:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Deletion failed" },
      { status: 500 }
    );
  }
}
