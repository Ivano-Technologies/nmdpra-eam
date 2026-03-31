import { makeFunctionReference } from "convex/server";

/** No import from repo-root convex/_generated in apps/web — use function references. */
export const importLicensesMutation = makeFunctionReference<"mutation">(
  "ingest:importLicenses"
);

export const insertUploadMutation = makeFunctionReference<"mutation">(
  "uploads:insertUpload"
);

export const listUploadsQuery = makeFunctionReference<"query">(
  "uploads:listUploads"
);

export const patchUploadMutation = makeFunctionReference<"mutation">(
  "uploads:patchUploadAfterProcess"
);

export const listSubscriptionsQuery = makeFunctionReference<"query">(
  "reportSubscriptions:listSubscriptions"
);

export const upsertSubscriptionMutation = makeFunctionReference<"mutation">(
  "reportSubscriptions:upsertSubscription"
);

export const removeSubscriptionMutation = makeFunctionReference<"mutation">(
  "reportSubscriptions:removeSubscription"
);

export const setLastSentMutation = makeFunctionReference<"mutation">(
  "reportSubscriptions:setLastSent"
);

export const mvpReportDataQuery = makeFunctionReference<"query">(
  "licenses:mvpReportData"
);

export const deleteOrgDataMutation = makeFunctionReference<"mutation">(
  "orgDeletion:deleteOrgData"
);

export const recordConsentMutation = makeFunctionReference<"mutation">(
  "consent:recordAcceptance"
);

export const hasConsentQuery = makeFunctionReference<"query">(
  "consent:hasAccepted"
);
