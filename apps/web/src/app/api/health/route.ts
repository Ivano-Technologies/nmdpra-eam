import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
  const convexSecretConfigured = Boolean(convexUrl && jobSecret);

  return NextResponse.json(
    {
      status: "ok",
      /** True when both vars are non-empty (never exposes values). */
      convexSecretConfigured
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
