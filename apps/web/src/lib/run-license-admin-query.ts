import { clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { AuthRoleError, requirePermissionServer } from "@/lib/auth";
import type { Role } from "@/lib/roles";
import type { LicenseQueryScope } from "@/lib/tenant";
import { getLicenseQueryScope } from "@/lib/tenant";

type LicenseCtx = {
  convex: ConvexHttpClient;
  scope: LicenseQueryScope;
  userId: string;
  role: Role;
};

/**
 * Authenticated admin/owner licence API helper — same scope pattern as
 * {@link apps/web/src/app/api/licenses/risk-ranking/route.ts}.
 */
export async function runLicenseAdminQuery<T>(
  fn: (ctx: LicenseCtx) => Promise<T>
): Promise<T | NextResponse> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!convexUrl) {
    return NextResponse.json(
      { error: "Convex not configured", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  let userId: string;
  let role: Role;
  try {
    ({ userId, role } = await requirePermissionServer("admin"));
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json(
        { error: e.message, code: "FORBIDDEN" },
        { status: e.status }
      );
    }
    throw e;
  }

  try {
    const clerk = await clerkClient();
    const self = await clerk.users.getUser(userId);
    let scope: LicenseQueryScope;
    try {
      scope = getLicenseQueryScope(self.publicMetadata, role);
    } catch (e) {
      if (e instanceof AuthRoleError) {
        return NextResponse.json(
          { error: e.message, code: "FORBIDDEN" },
          { status: e.status }
        );
      }
      throw e;
    }
    const convex = new ConvexHttpClient(convexUrl);
    return await fn({ convex, scope, userId, role });
  } catch (e) {
    if (e instanceof AuthRoleError) {
      return NextResponse.json(
        { error: e.message, code: "FORBIDDEN" },
        { status: e.status }
      );
    }
    throw e;
  }
}
