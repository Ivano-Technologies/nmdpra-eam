import { mutation } from "./_generated/server";
import { v } from "convex/values";

import { computeDaysToExpiry, computeRiskScore, normalizeVendorKey } from "./helpers";

export const importLicenses = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        vendorName: v.string(),
        category: v.string(),
        licenseType: v.string(),
        issueDate: v.string(),
        expiryDate: v.string(),
        status: v.string()
      })
    )
  },
  handler: async (ctx, args) => {
    const expected = process.env.INGEST_SECRET;
    if (!expected || args.secret !== expected) {
      throw new Error("Unauthorized");
    }

    let imported = 0;

    for (const row of args.rows) {
      const normalizedName = normalizeVendorKey(row.vendorName);
      let vendor = await ctx.db
        .query("vendors")
        .withIndex("by_normalized_name", (q) => q.eq("normalizedName", normalizedName))
        .first();

      if (!vendor) {
        const vendorId = await ctx.db.insert("vendors", {
          name: row.vendorName,
          category: row.category,
          normalizedName
        });
        vendor = await ctx.db.get(vendorId);
      } else {
        await ctx.db.patch(vendor._id, {
          name: row.vendorName,
          category: row.category
        });
      }

      if (!vendor) {
        continue;
      }

      const days = computeDaysToExpiry(row.expiryDate);
      const riskScore = computeRiskScore(days);

      const existing = await ctx.db
        .query("licenses")
        .withIndex("by_vendor_type_expiry", (q) =>
          q.eq("vendorId", vendor._id).eq("licenseType", row.licenseType).eq("expiryDate", row.expiryDate)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          issueDate: row.issueDate,
          status: row.status,
          riskScore
        });
      } else {
        await ctx.db.insert("licenses", {
          vendorId: vendor._id,
          licenseType: row.licenseType,
          issueDate: row.issueDate,
          expiryDate: row.expiryDate,
          status: row.status,
          riskScore
        });
      }
      imported += 1;
    }

    return { imported, total: args.rows.length };
  }
});
