import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  vendors: defineTable({
    name: v.string(),
    category: v.string(),
    normalizedName: v.string(),
    /** Tenant scope; omit for legacy rows (visible to admin/owner when not filtering). */
    orgId: v.optional(v.string())
  })
    .index("by_normalized_name", ["normalizedName"])
    .index("by_org", ["orgId"]),

  auditLogs: defineTable({
    action: v.string(),
    actorUserId: v.string(),
    targetUserId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    /** When set, row can be purged with org data deletion. */
    orgId: v.optional(v.string())
  })
    .index("by_created", ["createdAt"])
    .index("by_org", ["orgId"]),

  /** Recorded policy / upload consent (server-written via secret). */
  consents: defineTable({
    userId: v.string(),
    orgId: v.string(),
    version: v.string(),
    scope: v.union(v.literal("terms"), v.literal("upload")),
    acceptedAt: v.number()
  })
    .index("by_org", ["orgId"])
    .index("by_user_org_scope", ["userId", "orgId", "scope"]),

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
    .index("by_vendor_type_expiry", ["vendorId", "licenseType", "expiryDate"]),

  /** Excel/source files stored in blob storage; ingestion scoped by orgId. */
  uploads: defineTable({
    orgId: v.string(),
    fileUrl: v.string(),
    fileName: v.optional(v.string()),
    uploadedBy: v.string(),
    uploadedAt: v.number(),
    lastProcessedAt: v.optional(v.number()),
    fileHash: v.string()
  }).index("by_org", ["orgId"]),

  /** Scheduled compliance report emails per org (cron sends via Resend). */
  reportSubscriptions: defineTable({
    orgId: v.string(),
    email: v.string(),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    createdAt: v.number(),
    lastSentAt: v.optional(v.number())
  }).index("by_org", ["orgId"])
});
