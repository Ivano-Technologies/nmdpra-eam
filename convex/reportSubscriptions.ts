import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function assertJobSecret(secret: string): void {
  const expected = process.env.INTERNAL_JOB_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized");
  }
}

const frequencyValidator = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly")
);

export const listSubscriptions = query({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    // eslint-disable-next-line local/no-collect-in-query
    const rows = await ctx.db.query("reportSubscriptions").collect();
    return rows.map((r) => ({
      id: r._id,
      orgId: r.orgId,
      email: r.email,
      frequency: r.frequency,
      createdAt: r.createdAt,
      lastSentAt: r.lastSentAt
    }));
  }
});

export const upsertSubscription = mutation({
  args: {
    secret: v.string(),
    orgId: v.string(),
    email: v.string(),
    frequency: frequencyValidator
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const emailNorm = args.email.trim().toLowerCase();
    const candidates = await ctx.db
      .query("reportSubscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
    const existing = candidates.find((r) => r.email === emailNorm);
    if (existing) {
      await ctx.db.patch(existing._id, { frequency: args.frequency });
      return existing._id;
    }
    return await ctx.db.insert("reportSubscriptions", {
      orgId: args.orgId,
      email: emailNorm,
      frequency: args.frequency,
      createdAt: Date.now()
    });
  }
});

export const removeSubscription = mutation({
  args: { secret: v.string(), subscriptionId: v.id("reportSubscriptions") },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    await ctx.db.delete(args.subscriptionId);
  }
});

export const setLastSent = mutation({
  args: {
    secret: v.string(),
    subscriptionId: v.id("reportSubscriptions"),
    lastSentAt: v.number()
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    await ctx.db.patch(args.subscriptionId, {
      lastSentAt: args.lastSentAt
    });
  }
});
