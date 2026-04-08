import { NextResponse } from "next/server";

import {
  getLastMockResendPayload,
  isMockResendEnabled
} from "@rmlis/resend-client";

/**
 * Dev/E2E only: last email payload captured when MOCK_RESEND=1 or E2E_MAIL_MOCK=1.
 */
export async function GET() {
  if (!isMockResendEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ payload: getLastMockResendPayload() });
}
