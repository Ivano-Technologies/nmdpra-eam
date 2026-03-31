import { query } from "./_generated/server";
import { v } from "convex/values";

/** Owner dashboard metrics; gated by the same secret as audit (trusted server callers only). */
export const overview = query({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    const expected = process.env.AUDIT_SECRET;
    if (!expected || args.secret !== expected) {
      throw new Error("Unauthorized");
    }
    // eslint-disable-next-line local/no-collect-in-query -- small tables; paginate if this grows large
    const vendors = await ctx.db.query("vendors").collect();
    // eslint-disable-next-line local/no-collect-in-query
    const licenses = await ctx.db.query("licenses").collect();
    return {
      vendorCount: vendors.length,
      licenseCount: licenses.length
    };
  }
});
