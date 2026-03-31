import type { NextApiRequest } from "next";
import {
  auth,
  clerkClient,
  currentUser,
  getAuth
} from "@clerk/nextjs/server";

import type { UserRole } from "@/lib/roles";
import { parseUserRole } from "@/lib/roles";

export class AuthRoleError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403
  ) {
    super(message);
    this.name = "AuthRoleError";
  }
}

/**
 * App Router / server actions: require an exact Clerk role (from publicMetadata.role).
 */
export async function requireRoleServer(
  requiredRole: UserRole
): Promise<{ userId: string; role: UserRole }> {
  const { userId } = await auth();
  if (!userId) {
    throw new AuthRoleError("Unauthorized", 401);
  }
  const user = await currentUser();
  const role = parseUserRole(user?.publicMetadata);
  if (role !== requiredRole) {
    throw new AuthRoleError("Forbidden", 403);
  }
  return { userId, role };
}

/**
 * Pages Router API routes: require an exact Clerk role.
 */
export async function requireRolePages(
  req: NextApiRequest,
  requiredRole: UserRole
): Promise<{ userId: string; role: UserRole }> {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new AuthRoleError("Unauthorized", 401);
  }
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = parseUserRole(user.publicMetadata);
  if (role !== requiredRole) {
    throw new AuthRoleError("Forbidden", 403);
  }
  return { userId, role };
}
