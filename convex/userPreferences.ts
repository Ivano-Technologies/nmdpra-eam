import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function assertJobSecret(secret: string): void {
  const expected = process.env.INTERNAL_JOB_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized");
  }
}

/** Map "HH:mm" to minutes from midnight (legacy digest UI). */
function timeStrToMinutes(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) {
    return 0;
  }
  const h = Math.min(23, Math.max(0, parseInt(m[1]!, 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2]!, 10)));
  return h * 60 + min;
}

function mergeRecord(
  a: Record<string, unknown> | undefined,
  b: unknown
): Record<string, unknown> | undefined {
  if (b === undefined) {
    return a;
  }
  if (b === null || typeof b !== "object" || Array.isArray(b)) {
    return b as Record<string, unknown>;
  }
  return { ...(a ?? {}), ...(b as Record<string, unknown>) };
}

/**
 * Merge digest patches; keep legacy keys (`emailFrequency`, `quietHoursStart`) in sync
 * with normalized `frequency` and `quietHours: { start, end }` (minutes).
 */
function normalizeDigest(
  existing: Record<string, unknown> | undefined,
  patch: unknown
): Record<string, unknown> | undefined {
  if (patch === undefined) {
    return existing;
  }
  const merged = mergeRecord(existing, patch);
  if (!merged) {
    return undefined;
  }
  const freq =
    (merged.frequency as string | undefined) ??
    (merged.emailFrequency as string | undefined);
  if (freq !== undefined) {
    if (freq === "daily" || freq === "weekly") {
      merged.frequency = freq;
    } else {
      merged.frequency = "off";
    }
    merged.emailFrequency = merged.frequency;
  }
  const qh = merged.quietHours as { start?: number; end?: number } | undefined;
  const startStr = merged.quietHoursStart as string | undefined;
  const endStr = merged.quietHoursEnd as string | undefined;
  if (qh && typeof qh.start === "number" && typeof qh.end === "number") {
    merged.quietHours = qh;
  } else if (startStr !== undefined || endStr !== undefined) {
    merged.quietHours = {
      start: startStr ? timeStrToMinutes(startStr) : 22 * 60,
      end: endStr ? timeStrToMinutes(endStr) : 7 * 60
    };
  }
  if (merged.inAppOnly !== undefined) {
    merged.inAppBanner = merged.inAppOnly;
  }
  if (merged.inAppBanner !== undefined) {
    merged.inAppOnly = Boolean(merged.inAppBanner);
  }
  return merged;
}

export const getForUser = query({
  args: {
    secret: v.string(),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    return await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  }
});

/** Bounded scan for notification policy evaluation (cron / internal only). */
export const listDigestForPolicy = query({
  args: {
    secret: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const lim = Math.min(500, Math.max(1, args.limit ?? 200));
    const rows = await ctx.db.query("userPreferences").take(lim);
    return rows.map((r) => ({
      userId: r.userId,
      orgId: r.orgId,
      digest: r.digest,
      consents: r.consents,
      lastNotifiedAt: r.lastNotifiedAt,
      weeklySummarySnippet: r.weeklySummarySnippet
    }));
  }
});

export const setLastNotifiedAt = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    lastNotifiedAt: v.number()
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastNotifiedAt: args.lastNotifiedAt,
        updatedAt: now
      });
      return { ok: true as const };
    }
    await ctx.db.insert("userPreferences", {
      userId: args.userId,
      version: 1,
      lastNotifiedAt: args.lastNotifiedAt,
      updatedAt: now
    });
    return { ok: true as const };
  }
});

export const requestDeletion = mutation({
  args: {
    secret: v.string(),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const now = Date.now();
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const deletion = {
      status: "pending" as const,
      requestedAt: now
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        deletion,
        updatedAt: now
      });
    } else {
      await ctx.db.insert("userPreferences", {
        userId: args.userId,
        deletion,
        version: 1,
        updatedAt: now
      });
    }

    await ctx.db.insert("auditLogs", {
      action: "USER_DATA_DELETION_REQUESTED",
      actorUserId: args.userId,
      metadata: { subjectUserId: args.userId },
      createdAt: now
    });

    return { ok: true as const };
  }
});

export const upsertPatch = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    orgId: v.optional(v.string()),
    patch: v.any()
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const p = args.patch as Record<string, unknown>;
    const now = Date.now();

    const mergedOnboarding = mergeRecord(
      existing?.onboardingSteps as Record<string, unknown> | undefined,
      p.onboardingSteps
    );
    const mergedMilestones = mergeRecord(
      existing?.milestones as Record<string, unknown> | undefined,
      p.milestones
    );
    const mergedDigest = normalizeDigest(
      existing?.digest as Record<string, unknown> | undefined,
      p.digest
    );
    const mergedConsents = mergeRecord(
      existing?.consents as Record<string, unknown> | undefined,
      p.consents
    );
    const mergedDeletion = mergeRecord(
      existing?.deletion as Record<string, unknown> | undefined,
      p.deletion
    );

    const baseVersion = (existing?.version as number | undefined) ?? 1;
    let nextVersion = baseVersion;
    if (p.version !== undefined && typeof p.version === "number") {
      nextVersion = p.version;
    } else if (p.consents !== undefined) {
      nextVersion = baseVersion + 1;
    }

    const next = {
      userId: args.userId,
      orgId:
        p.orgId !== undefined
          ? (p.orgId as string | undefined)
          : (existing?.orgId ?? args.orgId),
      version: nextVersion,
      consents:
        p.consents !== undefined ? mergedConsents : existing?.consents,
      deletion:
        p.deletion !== undefined ? mergedDeletion : existing?.deletion,
      dashboardLayout:
        p.dashboardLayout !== undefined
          ? p.dashboardLayout
          : existing?.dashboardLayout,
      onboardingSteps:
        p.onboardingSteps !== undefined
          ? mergedOnboarding
          : existing?.onboardingSteps,
      savedViews:
        p.savedViews !== undefined ? p.savedViews : existing?.savedViews,
      digest: p.digest !== undefined ? mergedDigest : existing?.digest,
      milestones:
        p.milestones !== undefined ? mergedMilestones : existing?.milestones,
      weeklySummarySnippet:
        p.weeklySummarySnippet !== undefined
          ? (p.weeklySummarySnippet as string | undefined)
          : existing?.weeklySummarySnippet,
      weeklySummaryAt:
        p.weeklySummaryAt !== undefined
          ? (p.weeklySummaryAt as number | undefined)
          : existing?.weeklySummaryAt,
      updatedAt: now
    };

    if (existing) {
      await ctx.db.patch(existing._id, next);
      return existing._id;
    }

    const ledger = await ctx.db
      .query("userErasureLedger")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (ledger) {
      await ctx.db.delete(ledger._id);
    }

    return await ctx.db.insert("userPreferences", {
      userId: next.userId,
      orgId: next.orgId,
      version: next.version ?? 1,
      consents: next.consents,
      deletion: next.deletion,
      dashboardLayout: next.dashboardLayout,
      onboardingSteps: next.onboardingSteps,
      savedViews: next.savedViews,
      digest: next.digest,
      milestones: next.milestones,
      weeklySummarySnippet: next.weeklySummarySnippet,
      weeklySummaryAt: next.weeklySummaryAt,
      updatedAt: now
    });
  }
});
