import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { appendAuditLog } from "@/lib/audit-server";
import type { Role } from "@/lib/roles";
import { parseUserRole } from "@/lib/roles";

const VALID_ROLES: Role[] = ["owner", "admin", "client"];

function isRole(value: unknown): value is Role {
  return typeof value === "string" && VALID_ROLES.includes(value as Role);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const self = await client.users.getUser(userId);
  if (parseUserRole(self.publicMetadata) !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected JSON object" }, { status: 400 });
  }

  const targetUserId = String(
    (body as { targetUserId?: unknown }).targetUserId ?? ""
  ).trim();
  const newRole = (body as { newRole?: unknown }).newRole;

  if (!targetUserId) {
    return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
  }
  if (!isRole(newRole)) {
    return NextResponse.json(
      { error: "newRole must be owner, admin, or client" },
      { status: 400 }
    );
  }

  if (targetUserId === userId) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 }
    );
  }

  const target = await client.users.getUser(targetUserId);
  const prevRole = parseUserRole(target.publicMetadata);
  const prev =
    target.publicMetadata && typeof target.publicMetadata === "object"
      ? { ...target.publicMetadata }
      : {};

  await client.users.updateUserMetadata(targetUserId, {
    publicMetadata: { ...prev, role: newRole }
  });

  await appendAuditLog({
    action: "role.change",
    actorUserId: userId,
    targetUserId,
    metadata: { prevRole, newRole }
  });

  return NextResponse.json({ success: true });
}
