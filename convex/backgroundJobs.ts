import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const jobStatus = v.union(
  v.literal("processing"),
  v.literal("complete"),
  v.literal("failed")
);

export const create = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    kind: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    if (args.secret !== process.env.INTERNAL_JOB_SECRET) {
      throw new Error("Unauthorized");
    }
    const now = Date.now();
    return await ctx.db.insert("backgroundJobs", {
      userId: args.userId,
      status: "processing",
      kind: args.kind,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const patch = mutation({
  args: {
    secret: v.string(),
    jobId: v.id("backgroundJobs"),
    userId: v.string(),
    status: jobStatus,
    result: v.optional(v.any()),
    error: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    if (args.secret !== process.env.INTERNAL_JOB_SECRET) {
      throw new Error("Unauthorized");
    }
    const row = await ctx.db.get(args.jobId);
    if (!row || row.userId !== args.userId) {
      throw new Error("Not found");
    }
    await ctx.db.patch(args.jobId, {
      status: args.status,
      result: args.result,
      error: args.error,
      updatedAt: Date.now()
    });
    return null;
  }
});

export const getForUser = query({
  args: {
    secret: v.string(),
    userId: v.string(),
    jobId: v.id("backgroundJobs")
  },
  handler: async (ctx, args) => {
    if (args.secret !== process.env.INTERNAL_JOB_SECRET) {
      throw new Error("Unauthorized");
    }
    const row = await ctx.db.get(args.jobId);
    if (!row || row.userId !== args.userId) {
      return null;
    }
    return {
      jobId: row._id,
      status: row.status,
      result: row.result,
      error: row.error,
      kind: row.kind,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
});
