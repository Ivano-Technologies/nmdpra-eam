import { NextResponse } from "next/server";

import { getMockEmailsByTestRunId } from "@rmlis/resend-client";

/** Dev/E2E only: captured mock payloads (shared store with App Router send path). */
export async function GET(req: Request) {
  const testRunId = req.headers.get("x-test-run-id");
  const emails = getMockEmailsByTestRunId(testRunId);
  return NextResponse.json({ emails });
}
