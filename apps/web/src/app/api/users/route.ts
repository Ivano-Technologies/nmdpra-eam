import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseUserRole } from "@/lib/roles";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const self = await client.users.getUser(userId);
  if (parseUserRole(self.publicMetadata) !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const limitRaw = url.searchParams.get("limit");
  const offsetRaw = url.searchParams.get("offset");
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(limitRaw) || DEFAULT_LIMIT)
  );
  const offset = Math.max(0, Number(offsetRaw) || 0);

  const res = await client.users.getUserList({
    limit,
    offset
  });

  const users = (Array.isArray(res.data) ? res.data : []).map((u) => ({
    id: u.id,
    email: u.primaryEmailAddress?.emailAddress ?? null,
    role: parseUserRole(u.publicMetadata),
    lastSignInAt:
      u.lastSignInAt != null
        ? new Date(u.lastSignInAt).toISOString()
        : null
  }));

  return NextResponse.json({
    users,
    totalCount: res.totalCount,
    limit,
    offset
  });
}
