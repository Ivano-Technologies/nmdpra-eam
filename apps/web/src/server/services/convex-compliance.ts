import { ConvexHttpClient } from "convex/browser";

import { auditAppendComplianceMutation } from "@/lib/internal-convex-refs";

export async function appendComplianceAudit(params: {
  action: string;
  actorUserId: string;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
  orgId?: string;
}): Promise<void> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
  if (!convexUrl || !jobSecret) {
    return;
  }
  const client = new ConvexHttpClient(convexUrl);
  await client.mutation(auditAppendComplianceMutation, {
    secret: jobSecret,
    action: params.action,
    actorUserId: params.actorUserId,
    targetUserId: params.targetUserId,
    metadata: params.metadata,
    orgId: params.orgId
  });
}
