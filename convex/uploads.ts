import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function assertJobSecret(secret: string): void {
  const expected = process.env.INTERNAL_JOB_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized");
  }
}

export const insertUpload = mutation({
  args: {
    secret: v.string(),
    orgId: v.string(),
    fileUrl: v.string(),
    fileName: v.optional(v.string()),
    uploadedBy: v.string(),
    fileHash: v.string(),
    lastProcessedAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const id = await ctx.db.insert("uploads", {
      orgId: args.orgId,
      fileUrl: args.fileUrl,
      fileName: args.fileName,
      uploadedBy: args.uploadedBy,
      uploadedAt: Date.now(),
      fileHash: args.fileHash,
      lastProcessedAt: args.lastProcessedAt
    });
    return id;
  }
});

export const listUploads = query({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    // eslint-disable-next-line local/no-collect-in-query
    const rows = await ctx.db.query("uploads").collect();
    return rows.map((r) => ({
      id: r._id,
      orgId: r.orgId,
      fileUrl: r.fileUrl,
      fileName: r.fileName,
      uploadedBy: r.uploadedBy,
      uploadedAt: r.uploadedAt,
      lastProcessedAt: r.lastProcessedAt,
      fileHash: r.fileHash
    }));
  }
});

export const patchUploadAfterProcess = mutation({
  args: {
    secret: v.string(),
    uploadId: v.id("uploads"),
    fileHash: v.string(),
    lastProcessedAt: v.number()
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    await ctx.db.patch(args.uploadId, {
      fileHash: args.fileHash,
      lastProcessedAt: args.lastProcessedAt
    });
  }
});
