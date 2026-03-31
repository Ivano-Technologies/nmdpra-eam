import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const append = mutation({
  args: {
    secret: v.string(),
    action: v.string(),
    actorUserId: v.string(),
    targetUserId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    orgId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const expected = process.env.AUDIT_SECRET;
    if (!expected || args.secret !== expected) {
      throw new Error("Unauthorized");
    }
    await ctx.db.insert("auditLogs", {
      action: args.action,
      actorUserId: args.actorUserId,
      targetUserId: args.targetUserId,
      metadata: args.metadata,
      createdAt: Date.now(),
      ...(args.orgId !== undefined ? { orgId: args.orgId } : {})
    });
  }
});

export const list = query({
  args: {
    secret: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const expected = process.env.AUDIT_SECRET;
    if (!expected || args.secret !== expected) {
      throw new Error("Unauthorized");
    }
    const limit = Math.min(100, Math.max(1, args.limit ?? 50));
    // Owner-only list; bounded by slice below. Use index pagination if audit volume grows.
    // eslint-disable-next-line local/no-collect-in-query -- small governance table; capped in UI
    const rows = await ctx.db.query("auditLogs").collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    const slice = rows.slice(0, limit);
    return slice.map((r) => ({
      id: r._id,
      action: r.action,
      actorUserId: r.actorUserId,
      targetUserId: r.targetUserId,
      metadata: r.metadata,
      createdAt: r.createdAt,
      orgId: r.orgId
    }));
  }
});
