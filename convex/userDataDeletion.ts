import { mutation } from "./_generated/server";
import { v } from "convex/values";

const REDACTED = "[deleted_user]";

function assertJobSecret(secret: string): void {
  const expected = process.env.INTERNAL_JOB_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized");
  }
}

type ErasureCounts = {
  userPreferencesDeleted: number;
  consentsDeleted: number;
  uploadsDeleted: number;
  reportSubscriptionsDeleted: number;
  auditLogsAnonymized: number;
};

const emptyCounts = (): ErasureCounts => ({
  userPreferencesDeleted: 0,
  consentsDeleted: 0,
  uploadsDeleted: 0,
  reportSubscriptionsDeleted: 0,
  auditLogsAnonymized: 0
});

/**
 * Per-user erasure. Requires `deletion.status === "pending"` unless
 * `requirePending === false`. Records `userErasureLedger` for idempotency.
 */
export const eraseUserData = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    userEmailNorm: v.optional(v.string()),
    /** When false, skips pending gate (internal / migration only). */
    requirePending: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const { userId, userEmailNorm } = args;
    const requirePending = args.requirePending !== false;

    const ledger = await ctx.db
      .query("userErasureLedger")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (ledger) {
      return {
        ok: true as const,
        status: "already_completed" as const,
        completedAt: ledger.completedAt,
        counts: (ledger.counts as ErasureCounts | undefined) ?? emptyCounts()
      };
    }

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const deletion = prefs?.deletion as
      | { status?: string }
      | undefined;

    if (requirePending) {
      if (!prefs || deletion?.status !== "pending") {
        return {
          ok: false as const,
          status: "pending_required" as const,
          completedAt: Date.now(),
          counts: emptyCounts()
        };
      }
    }

    const counts = emptyCounts();

    const consentRows = await ctx.db
      .query("consents")
      .withIndex("by_user_org_scope", (q) => q.eq("userId", userId))
      .collect();

    const uploadRows = await ctx.db
      .query("uploads")
      .withIndex("by_uploaded_by", (q) => q.eq("uploadedBy", userId))
      .collect();

    const subRows =
      userEmailNorm && userEmailNorm.trim().length > 0
        ? await ctx.db
            .query("reportSubscriptions")
            .withIndex("by_email", (q) =>
              q.eq("email", userEmailNorm.trim().toLowerCase())
            )
            .collect()
        : [];

    const asActor = await ctx.db
      .query("auditLogs")
      .withIndex("by_actor", (q) => q.eq("actorUserId", userId))
      .collect();
    const asTarget = await ctx.db
      .query("auditLogs")
      .withIndex("by_target", (q) => q.eq("targetUserId", userId))
      .collect();

    const hasWork =
      prefs !== null ||
      consentRows.length > 0 ||
      uploadRows.length > 0 ||
      subRows.length > 0 ||
      asActor.length > 0 ||
      asTarget.length > 0;

    if (!hasWork) {
      return {
        ok: true as const,
        status: "noop" as const,
        completedAt: Date.now(),
        counts
      };
    }

    if (prefs) {
      await ctx.db.delete(prefs._id);
      counts.userPreferencesDeleted = 1;
    }

    for (const c of consentRows) {
      await ctx.db.delete(c._id);
      counts.consentsDeleted += 1;
    }

    for (const u of uploadRows) {
      await ctx.db.delete(u._id);
      counts.uploadsDeleted += 1;
    }

    for (const s of subRows) {
      await ctx.db.delete(s._id);
      counts.reportSubscriptionsDeleted += 1;
    }

    const seen = new Set<string>();
    for (const row of [...asActor, ...asTarget]) {
      const key = row._id;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      await ctx.db.patch(key, {
        actorUserId: row.actorUserId === userId ? REDACTED : row.actorUserId,
        targetUserId:
          row.targetUserId === userId ? undefined : row.targetUserId,
        metadata: undefined
      });
      counts.auditLogsAnonymized += 1;
    }

    const completedAt = Date.now();
    await ctx.db.insert("userErasureLedger", {
      userId,
      completedAt,
      counts
    });

    await ctx.db.insert("auditLogs", {
      action: "USER_DATA_DELETED",
      actorUserId: "__system_data_erasure__",
      metadata: {
        subjectUserId: userId,
        counts,
        completedAt
      },
      createdAt: completedAt
    });

    return {
      ok: true as const,
      status: "completed" as const,
      completedAt,
      counts
    };
  }
});
