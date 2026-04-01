import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function assertJobSecret(secret: string): void {
  const expected = process.env.INTERNAL_JOB_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized");
  }
}

export const createExportJob = mutation({
  args: {
    secret: v.string(),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
    const id = await ctx.db.insert("dataExports", {
      userId: args.userId,
      status: "pending",
      createdAt: now,
      expiresAt
    });
    return id;
  }
});

export const finalizeExportStub = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    exportId: v.id("dataExports")
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const doc = await ctx.db.get(args.exportId);
    if (!doc || doc.userId !== args.userId) {
      throw new Error("Export not found");
    }
    const payload = {
      kind: "stub" as const,
      message:
        "Full export pipeline not implemented. This placeholder confirms a job was created.",
      userId: args.userId,
      completedAt: Date.now()
    };
    await ctx.db.patch(args.exportId, {
      status: "ready",
      url: JSON.stringify(payload)
    });
    return { ok: true as const };
  }
});

export const getExportForUser = query({
  args: {
    secret: v.string(),
    userId: v.string(),
    exportId: v.id("dataExports")
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const doc = await ctx.db.get(args.exportId);
    if (!doc || doc.userId !== args.userId) {
      return null;
    }
    return {
      id: doc._id,
      status: doc.status,
      url: doc.url,
      error: doc.error,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt
    };
  }
});
