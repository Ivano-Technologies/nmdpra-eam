import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function assertJobSecret(secret: string): void {
  const expected = process.env.INTERNAL_JOB_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized");
  }
}

export const create = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    kind: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    await ctx.db.insert("notifications", {
      userId: args.userId,
      title: args.title,
      body: args.body,
      read: false,
      createdAt: Date.now(),
      kind: args.kind
    });
  }
});

export const listForUser = query({
  args: {
    secret: v.string(),
    userId: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const lim = Math.min(50, Math.max(1, args.limit ?? 20));
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const sorted = rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, lim);
    const unreadCount = rows.filter((r) => !r.read).length;
    return { notifications: sorted, unreadCount };
  }
});

export const markRead = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    notificationId: v.id("notifications")
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const doc = await ctx.db.get(args.notificationId);
    if (!doc || doc.userId !== args.userId) {
      throw new Error("Not found");
    }
    await ctx.db.patch(args.notificationId, { read: true });
  }
});

export const markAllRead = mutation({
  args: {
    secret: v.string(),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const r of rows) {
      if (!r.read) {
        await ctx.db.patch(r._id, { read: true });
      }
    }
  }
});
