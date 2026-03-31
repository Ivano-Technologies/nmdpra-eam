import type { NextApiRequest } from "next";
import {
  auth,
  clerkClient,
  currentUser,
  getAuth
} from "@clerk/nextjs/server";

import type { Role } from "@/lib/roles";
import { hasPermission, parseUserRole } from "@/lib/roles";
import { AuthRoleError } from "@/lib/auth-role-error";

export { AuthRoleError };

/**
 * App Router: current user's role from Clerk (publicMetadata.role), default client.
 */
export async function getCurrentUserRole(): Promise<Role> {
  const { userId } = await auth();
  if (!userId) {
    throw new AuthRoleError("Unauthorized", 401);
  }
  const user = await currentUser();
  return parseUserRole(user?.publicMetadata);
}

/**
 * App Router / server actions: require at least `minimumRole` in the hierarchy.
 */
export async function requirePermissionServer(
  minimumRole: Role
): Promise<{ userId: string; role: Role }> {
  const { userId } = await auth();
  if (!userId) {
    throw new AuthRoleError("Unauthorized", 401);
  }
  const user = await currentUser();
  const role = parseUserRole(user?.publicMetadata);
  if (!hasPermission(role, minimumRole)) {
    throw new AuthRoleError("Forbidden", 403);
  }
  return { userId, role };
}

/**
 * Pages Router API: require at least `minimumRole` in the hierarchy.
 */
export async function requirePermissionPages(
  req: NextApiRequest,
  minimumRole: Role
): Promise<{ userId: string; role: Role }> {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new AuthRoleError("Unauthorized", 401);
  }
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = parseUserRole(user.publicMetadata);
  if (!hasPermission(role, minimumRole)) {
    throw new AuthRoleError("Forbidden", 403);
  }
  return { userId, role };
}

/** @deprecated Use {@link requirePermissionServer} */
export const requireRoleServer = requirePermissionServer;

/** @deprecated Use {@link requirePermissionPages} */
export const requireRolePages = requirePermissionPages;
