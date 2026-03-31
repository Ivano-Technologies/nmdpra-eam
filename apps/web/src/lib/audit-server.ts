import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const auditAppend = makeFunctionReference<"mutation">("audit:append");

export async function appendAuditLog(input: {
  action: string;
  actorUserId: string;
  targetUserId?: string;
  metadata?: unknown;
  /** When set, included in org-wide purge (Convex auditLogs.by_org). */
  orgId?: string;
}): Promise<void> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const secret = process.env.AUDIT_SECRET?.trim();
  if (!url || !secret) {
    console.warn(
      "[audit] AUDIT_SECRET or NEXT_PUBLIC_CONVEX_URL missing; skipping audit log"
    );
    return;
  }
  const client = new ConvexHttpClient(url);
  await client.mutation(auditAppend, {
    secret,
    action: input.action,
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    metadata: input.metadata,
    ...(input.orgId !== undefined ? { orgId: input.orgId } : {})
  });
}
