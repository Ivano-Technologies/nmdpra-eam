import { createHash } from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { verifyCronRequest } from "@/lib/cron-auth";
import {
  importLicensesMutation,
  listUploadsQuery,
  patchUploadMutation
} from "@/lib/internal-convex-refs";
import { parseExcelBufferToRows } from "@/lib/parse-excel-ingest";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const ingestSecret = process.env.INGEST_SECRET?.trim();
  const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
  if (!convexUrl || !ingestSecret || !jobSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const client = new ConvexHttpClient(convexUrl);
  const uploads = await client.query(listUploadsQuery, { secret: jobSecret });

  const results: Array<{ uploadId: string; orgId: string; status: string }> = [];

  for (const u of uploads) {
    try {
      const fileRes = await fetch(u.fileUrl);
      if (!fileRes.ok) {
        results.push({
          uploadId: u.id,
          orgId: u.orgId,
          status: `fetch_failed_${fileRes.status}`
        });
        continue;
      }

      const arrayBuffer = await fileRes.arrayBuffer();
      const newHash = createHash("sha256")
        .update(Buffer.from(arrayBuffer))
        .digest("hex");

      if (newHash === u.fileHash) {
        results.push({ uploadId: u.id, orgId: u.orgId, status: "unchanged" });
        continue;
      }

      const { rows, warnings } = parseExcelBufferToRows(arrayBuffer);
      if (rows.length === 0) {
        results.push({
          uploadId: u.id,
          orgId: u.orgId,
          status: `no_rows:${warnings[0] ?? "empty"}`
        });
        continue;
      }

      await client.mutation(importLicensesMutation, {
        secret: ingestSecret,
        defaultOrgId: u.orgId,
        rows
      });

      await client.mutation(patchUploadMutation, {
        secret: jobSecret,
        uploadId: u.id,
        fileHash: newHash,
        lastProcessedAt: Date.now()
      });

      results.push({ uploadId: u.id, orgId: u.orgId, status: "reingested" });
    } catch (e) {
      results.push({
        uploadId: u.id,
        orgId: u.orgId,
        status: `error:${e instanceof Error ? e.message : "unknown"}`
      });
    }
  }

  return NextResponse.json({
    success: true,
    checked: uploads.length,
    results
  });
}
