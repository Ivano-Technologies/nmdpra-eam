import type { NextApiRequest, NextApiResponse } from "next";
import { clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

import { AuthRoleError, requirePermissionPages } from "@/lib/auth";
import type { Role } from "@/lib/roles";
import type { LicenseQueryScope } from "@/lib/tenant";
import { getLicenseQueryScope } from "@/lib/tenant";

/** No import from repo-root `convex/_generated` — Vercel Root Directory `apps/web` omits that tree. */
const mvpReportDataQuery = makeFunctionReference<"query">(
  "licenses:mvpReportData"
);

type OkBody = { success: true; data: unknown };
type ErrBody = { success: false; error: string };

/**
 * Pages Router API (path must stay under pages/api/reports/mvp.ts).
 * Convex public query: {@link convex/licenses.ts} `mvpReportData`.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OkBody | ErrBody>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  let userId: string;
  let role: Role;
  try {
    ({ userId, role } = await requirePermissionPages(req, "admin"));
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return res.status(e.status).json({
        success: false,
        error: e.message
      });
    }
    throw e;
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!convexUrl) {
    console.error("MVP API error: NEXT_PUBLIC_CONVEX_URL is not set");
    return res.status(500).json({
      success: false,
      error: "Failed to load report"
    });
  }

  try {
    const clerk = await clerkClient();
    const self = await clerk.users.getUser(userId);
    let scope: LicenseQueryScope;
    try {
      scope = getLicenseQueryScope(self.publicMetadata, role);
    } catch (e) {
      if (e instanceof AuthRoleError) {
        return res.status(e.status).json({
          success: false,
          error: e.message
        });
      }
      throw e;
    }
    const convex = new ConvexHttpClient(convexUrl);
    const data = await convex.query(mvpReportDataQuery, scope);
    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("MVP API error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to load report"
    });
  }
}
