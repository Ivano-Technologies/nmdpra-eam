import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  vendors: defineTable({
    name: v.string(),
    category: v.string(),
    normalizedName: v.string()
  }).index("by_normalized_name", ["normalizedName"]),

  licenses: defineTable({
    vendorId: v.id("vendors"),
    licenseType: v.string(),
    issueDate: v.string(),
    expiryDate: v.string(),
    status: v.string(),
    riskScore: v.number()
  })
    .index("by_vendor", ["vendorId"])
    .index("by_expiry", ["expiryDate"])
    .index("by_vendor_type_expiry", ["vendorId", "licenseType", "expiryDate"])
});
