import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const consentScope = v.union(v.literal("terms"), v.literal("upload"));

function assertJobSecret(secret: string): void {
  const expected = process.env.INTERNAL_JOB_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized");
  }
}

export const recordAcceptance = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    orgId: v.string(),
    version: v.string(),
    scope: consentScope
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    await ctx.db.insert("consents", {
      userId: args.userId,
      orgId: args.orgId,
      version: args.version,
      scope: args.scope,
      acceptedAt: Date.now()
    });
  }
});

export const hasAccepted = query({
  args: {
    secret: v.string(),
    userId: v.string(),
    orgId: v.string(),
    version: v.string(),
    scope: consentScope
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const rows = await ctx.db
      .query("consents")
      .withIndex("by_user_org_scope", (q) =>
        q
          .eq("userId", args.userId)
          .eq("orgId", args.orgId)
          .eq("scope", args.scope)
      )
      .take(200);
    return rows.some((r) => r.version === args.version);
  }
});
