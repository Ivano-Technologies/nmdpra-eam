import { mutation } from "./_generated/server";
import { v } from "convex/values";

function assertJobSecret(secret: string): void {
  const expected = process.env.INTERNAL_JOB_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized");
  }
}

export const deleteOrgData = mutation({
  args: {
    secret: v.string(),
    orgId: v.string()
  },
  handler: async (ctx, args) => {
    assertJobSecret(args.secret);
    const { orgId } = args;

    let vendorsDeleted = 0;
    let licensesDeleted = 0;

    const vendors = await ctx.db
      .query("vendors")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    for (const vendor of vendors) {
      const licenses = await ctx.db
        .query("licenses")
        .withIndex("by_vendor", (q) => q.eq("vendorId", vendor._id))
        .collect();
      for (const lic of licenses) {
        await ctx.db.delete(lic._id);
        licensesDeleted += 1;
      }
      await ctx.db.delete(vendor._id);
      vendorsDeleted += 1;
    }

    const uploads = await ctx.db
      .query("uploads")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
    for (const u of uploads) {
      await ctx.db.delete(u._id);
    }

    const subs = await ctx.db
      .query("reportSubscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
    for (const s of subs) {
      await ctx.db.delete(s._id);
    }

    const auditRows = await ctx.db
      .query("auditLogs")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
    for (const row of auditRows) {
      await ctx.db.delete(row._id);
    }

    const consentRows = await ctx.db
      .query("consents")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
    for (const c of consentRows) {
      await ctx.db.delete(c._id);
    }

    return {
      vendorsDeleted,
      licensesDeleted,
      uploadsDeleted: uploads.length,
      reportSubscriptionsDeleted: subs.length,
      auditLogsDeleted: auditRows.length,
      consentsDeleted: consentRows.length
    };
  }
});
