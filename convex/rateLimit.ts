import { mutation } from "./_generated/server";
import { v } from "convex/values";

function assertJobSecret(secret: string): void {
  const expected = process.env.INTERNAL_JOB_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized");
  }
}

/**
 * Fixed-window counter per key (e.g. `userId:delete-request`). Serverless-safe.
 */
export const checkAndIncrement = mutation({
  args: {
    secret: v.string(),
    key: v.string(),
    max: v.number(),
    windowMs: v.number()
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const now = Date.now();
    const row = await ctx.db
      .query("rateLimitBuckets")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!row || now > row.windowEnds) {
      if (row) {
        await ctx.db.delete(row._id);
      }
      await ctx.db.insert("rateLimitBuckets", {
        key: args.key,
        windowEnds: now + args.windowMs,
        count: 1
      });
      return { allowed: true as const, remaining: args.max - 1 };
    }

    if (row.count >= args.max) {
      return { allowed: false as const, remaining: 0 };
    }

    await ctx.db.patch(row._id, { count: row.count + 1 });
    return { allowed: true as const, remaining: args.max - row.count - 1 };
  }
});
