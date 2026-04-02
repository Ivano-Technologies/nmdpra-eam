import { currentUser } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { createHash } from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { AuthRoleError, requirePermissionServer } from "@/lib/auth";
import {
  importLicensesMutation,
  insertUploadMutation
} from "@/lib/internal-convex-refs";
import { parseExcelBufferToRows } from "@/lib/parse-excel-ingest";
import { resolveUploadOrgId } from "@/lib/resolve-upload-org";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userId, role } = await requirePermissionServer("admin");
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const formOrgId = formData.get("orgId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Upload an Excel file (.xlsx or .xls)" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const hash = createHash("sha256")
      .update(Buffer.from(arrayBuffer))
      .digest("hex");

    const resolved = resolveUploadOrgId({
      role,
      metadata: user.publicMetadata,
      formOrgId: typeof formOrgId === "string" ? formOrgId : undefined
    });
    if (!resolved.ok) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status ?? 400 }
      );
    }
    const { orgId } = resolved;

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (!blobToken) {
      return NextResponse.json(
        { error: "File storage is not configured (BLOB_READ_WRITE_TOKEN)" },
        { status: 503 }
      );
    }

    const { rows, warnings } = parseExcelBufferToRows(arrayBuffer);
    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: "No licence rows parsed from this file",
          warnings: warnings.slice(0, 50)
        },
        { status: 400 }
      );
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
    const ingestSecret = process.env.INGEST_SECRET?.trim();
    const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
    if (!convexUrl || !ingestSecret || !jobSecret) {
      return NextResponse.json(
        { error: "Server ingestion is not fully configured" },
        { status: 503 }
      );
    }

    const pathname = `uploads/${orgId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const blob = await put(pathname, Buffer.from(arrayBuffer), {
      access: "private",
      token: blobToken
    });

    const client = new ConvexHttpClient(convexUrl);
    const ingestResult = await client.mutation(importLicensesMutation, {
      secret: ingestSecret,
      defaultOrgId: orgId,
      rows
    });

    const now = Date.now();
    const uploadId = await client.mutation(insertUploadMutation, {
      secret: jobSecret,
      orgId,
      fileUrl: blob.url,
      fileName: file.name,
      uploadedBy: userId,
      fileHash: hash,
      lastProcessedAt: now
    });

    return NextResponse.json({
      success: true,
      uploadId,
      fileUrl: blob.url,
      imported: ingestResult.imported,
      total: ingestResult.total,
      warnings: warnings.slice(0, 30)
    });
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/upload:", e);
    const message =
      e instanceof Error && e.message
        ? "Upload failed. Please try again or contact support."
        : "Upload failed. Please try again.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
