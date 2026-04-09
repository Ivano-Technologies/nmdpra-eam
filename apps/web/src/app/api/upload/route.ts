import { currentUser } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { createHash } from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { AuthRoleError, requirePermissionServer } from "@/lib/auth";
import {
  backgroundJobsCreateMutation,
  backgroundJobsPatchMutation,
  importLicensesMutation,
  insertUploadMutation
} from "@/lib/internal-convex-refs";
import { parseExcelBufferToRows } from "@/lib/parse-excel-ingest";
import { resolveUploadOrgId } from "@/lib/resolve-upload-org";
import type { CanonicalLicenseRow } from "@rmlis/shared";
import {
  getResendFromEmail,
  isResendConfigured,
  sendValidatedEmail
} from "@rmlis/resend-client";

export const runtime = "nodejs";
export const maxDuration = 800;
export const dynamic = "force-dynamic";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendUploadJobEmail(params: {
  to: string;
  ok: boolean;
  fileName: string;
  imported?: number;
  error?: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    return;
  }
  try {
    const from = getResendFromEmail();
    const subject = params.ok
      ? "Licence upload complete"
      : "Licence upload failed";
    const html = params.ok
      ? `<p>Your upload <strong>${escapeHtml(params.fileName)}</strong> finished successfully.</p><p>Imported ${params.imported ?? 0} row(s).</p>`
      : `<p>Your upload <strong>${escapeHtml(params.fileName)}</strong> failed.</p><p>${escapeHtml(params.error ?? "Unknown error")}</p>`;
    await sendValidatedEmail({
      from,
      to: params.to,
      subject,
      html
    });
  } catch (e) {
    console.error("upload job notification email:", e);
  }
}

type UploadJobPayload = {
  convexUrl: string;
  ingestSecret: string;
  jobSecret: string;
  jobId: string;
  userId: string;
  orgId: string;
  fileBytes: Buffer;
  rows: CanonicalLicenseRow[];
  fileName: string;
  hash: string;
  warnings: string[];
  notifyEmail?: string;
};

async function runUploadJob(payload: UploadJobPayload): Promise<void> {
  const {
    convexUrl,
    ingestSecret,
    jobSecret,
    jobId,
    userId,
    orgId,
    fileBytes,
    rows,
    fileName,
    hash,
    warnings,
    notifyEmail
  } = payload;

  const client = new ConvexHttpClient(convexUrl);

  const patchFailed = async (error: string) => {
    try {
      await client.mutation(backgroundJobsPatchMutation, {
        secret: jobSecret,
        jobId: jobId as never,
        userId,
        status: "failed",
        error
      });
    } catch (e) {
      console.error("patch job failed:", e);
    }
    if (notifyEmail) {
      await sendUploadJobEmail({
        to: notifyEmail,
        ok: false,
        fileName,
        error
      });
    }
  };

  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (!blobToken) {
      await patchFailed("File storage is not configured (BLOB_READ_WRITE_TOKEN)");
      return;
    }

    const pathname = `uploads/${orgId}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const blob = await put(pathname, fileBytes, {
      access: "private",
      token: blobToken
    });

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
      fileName,
      uploadedBy: userId,
      fileHash: hash,
      lastProcessedAt: now
    });

    await client.mutation(backgroundJobsPatchMutation, {
      secret: jobSecret,
      jobId: jobId as never,
      userId,
      status: "complete",
      result: {
        success: true,
        uploadId,
        fileUrl: blob.url,
        imported: ingestResult.imported,
        total: ingestResult.total,
        warnings: warnings.slice(0, 30)
      }
    });

    if (notifyEmail) {
      await sendUploadJobEmail({
        to: notifyEmail,
        ok: true,
        fileName,
        imported: ingestResult.imported
      });
    }
  } catch (e) {
    const message =
      e instanceof Error && e.message ? e.message : "Upload processing failed";
    console.error("runUploadJob:", e);
    await patchFailed(message);
  }
}

export async function POST(req: Request) {
  try {
    const { userId, role } = await requirePermissionServer("admin");
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const formOrgId = formData.get("orgId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
      return NextResponse.json(
        {
          error: "Upload an Excel file (.xlsx or .xls)",
          code: "VALIDATION_ERROR"
        },
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
        { error: resolved.error, code: "VALIDATION_ERROR" },
        { status: resolved.status ?? 400 }
      );
    }
    const { orgId } = resolved;

    if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
      return NextResponse.json(
        {
          error: "File storage is not configured (BLOB_READ_WRITE_TOKEN)",
          code: "SERVICE_UNAVAILABLE"
        },
        { status: 503 }
      );
    }

    const { rows, warnings } = parseExcelBufferToRows(arrayBuffer);
    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: "No licence rows parsed from this file",
          code: "PARSE_ERROR",
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
        {
          error: "Server ingestion is not fully configured",
          code: "SERVICE_UNAVAILABLE"
        },
        { status: 503 }
      );
    }

    const client = new ConvexHttpClient(convexUrl);
    const jobId = await client.mutation(backgroundJobsCreateMutation, {
      secret: jobSecret,
      userId,
      kind: "excel-upload"
    });

    const notifyEmail =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress;

    void runUploadJob({
      convexUrl,
      ingestSecret,
      jobSecret,
      jobId: String(jobId),
      userId,
      orgId,
      fileBytes: Buffer.from(arrayBuffer),
      rows,
      fileName: file.name,
      hash,
      warnings,
      notifyEmail
    });

    return NextResponse.json(
      { jobId: String(jobId), status: "processing" as const },
      { status: 202 }
    );
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json(
        { error: e.message, code: "FORBIDDEN" },
        { status: e.status }
      );
    }
    console.error("POST /api/upload:", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error && e.message
            ? "Upload failed. Please try again or contact support."
            : "Upload failed. Please try again.",
        code: "INTERNAL_ERROR"
      },
      { status: 500 }
    );
  }
}
