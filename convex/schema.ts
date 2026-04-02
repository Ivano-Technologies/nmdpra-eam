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
    .index("by_org", ["orgId"])
    .index("by_actor", ["actorUserId"])
    .index("by_target", ["targetUserId"]),

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
  })
    .index("by_org", ["orgId"])
    .index("by_uploaded_by", ["uploadedBy"]),

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
  })
    .index("by_org", ["orgId"])
    .index("by_email", ["email"]),

  /**
   * Per-user UX preferences (dashboard layout, onboarding, saved views, digest).
   * Written only from Next.js API with INTERNAL_JOB_SECRET + session userId.
   */
  userPreferences: defineTable({
    userId: v.string(),
    orgId: v.optional(v.string()),
    /** Prefs schema version for migrations (default 1). */
    version: v.optional(v.number()),
    /** Marketing / UX consent mirror; legal terms rows remain in `consents` table. */
    consents: v.optional(v.any()),
    /** Digest + quiet hours (legacy and normalized shapes supported). */
    digest: v.optional(v.any()),
    /** Two-step deletion: request → execute via DELETE /api/user/data. */
    deletion: v.optional(v.any()),
    dashboardLayout: v.optional(v.any()),
    onboardingSteps: v.optional(v.any()),
    savedViews: v.optional(v.any()),
    milestones: v.optional(v.any()),
    weeklySummarySnippet: v.optional(v.string()),
    weeklySummaryAt: v.optional(v.number()),
    /** Throttle notification dispatch (cron). */
    lastNotifiedAt: v.optional(v.number()),
    updatedAt: v.number()
  }).index("by_user", ["userId"]),

  /** In-app notifications (job or authenticated writers). */
  notifications: defineTable({
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
    kind: v.optional(v.string())
  }).index("by_user", ["userId"]),

  /** Proof of completed erasure; blocks repeat until new prefs row clears it (see upsertPatch). */
  userErasureLedger: defineTable({
    userId: v.string(),
    completedAt: v.number(),
    counts: v.optional(v.any())
  }).index("by_user", ["userId"]),

  /** Async data export jobs (Phase 2 scaffold). */
  dataExports: defineTable({
    userId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("ready"),
      v.literal("expired")
    ),
    url: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.optional(v.number())
  }).index("by_user", ["userId"]),

  /** Serverless-friendly rate limits (key = e.g. userId:delete-request). */
  rateLimitBuckets: defineTable({
    key: v.string(),
    windowEnds: v.number(),
    count: v.number()
  }).index("by_key", ["key"])
});
