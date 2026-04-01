import { ConvexHttpClient } from "convex/browser";

import { userDataErasureMutation } from "@/lib/internal-convex-refs";

export type DeleteUserDataInput = {
  userId: string;
  /** Primary email (normalized in Convex for subscriptions). */
  userEmailNorm?: string;
  /** When true (default), Convex requires `deletion.status === "pending"`. */
  requirePending?: boolean;
};

export type DeleteUserDataResult = {
  status:
    | "completed"
    | "noop"
    | "already_completed"
    | "pending_required";
  completedAt: number;
  counts: {
    userPreferencesDeleted: number;
    consentsDeleted: number;
    uploadsDeleted: number;
    reportSubscriptionsDeleted: number;
    auditLogsAnonymized: number;
  };
  warnings: string[];
};

/**
 * Server-only: erases Convex-backed personal data for the authenticated user.
 * Does not delete Clerk users or Vercel Blob binaries.
 */
export async function deleteUserData(
  input: DeleteUserDataInput
): Promise<DeleteUserDataResult> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
  if (!convexUrl || !jobSecret) {
    throw new Error("Data erasure not configured (Convex / INTERNAL_JOB_SECRET)");
  }

  const client = new ConvexHttpClient(convexUrl);
  const raw = (await client.mutation(userDataErasureMutation, {
    secret: jobSecret,
    userId: input.userId,
    userEmailNorm: input.userEmailNorm,
    requirePending: input.requirePending
  })) as {
    ok?: boolean;
    status:
      | "noop"
      | "completed"
      | "already_completed"
      | "pending_required";
    completedAt: number;
    counts: DeleteUserDataResult["counts"];
  };

  const warnings: string[] = [
    "Org-scoped licence and vendor rows are unchanged. Use org deletion if the organization must be wiped.",
    "Binary files in object storage (upload URLs) are not deleted by this endpoint; extend with a blob purge job if required."
  ];
  if (!input.userEmailNorm) {
    warnings.push(
      "No primary email on the Clerk profile — report email subscriptions were not matched for removal."
    );
  }

  if (raw.status === "pending_required") {
    return {
      status: "pending_required",
      completedAt: raw.completedAt,
      counts: raw.counts,
      warnings
    };
  }

  if (raw.status === "already_completed") {
    return {
      status: "already_completed",
      completedAt: raw.completedAt,
      counts: raw.counts,
      warnings
    };
  }

  if (raw.status === "noop") {
    return {
      status: "noop",
      completedAt: raw.completedAt,
      counts: raw.counts,
      warnings
    };
  }

  return {
    status: "completed",
    completedAt: raw.completedAt,
    counts: raw.counts,
    warnings
  };
}
