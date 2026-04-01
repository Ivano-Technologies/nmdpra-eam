/** Dashboard section ids (stable anchors). */
export type DashboardSectionId =
  | "overview"
  | "expiry-radar"
  | "risk-ranking"
  | "reports"
  | "data-upload"
  | "owner-panel";

export type DashboardLayout = {
  /** Ordered section ids (first = top). */
  order: DashboardSectionId[];
  /** Hidden section ids. */
  hidden: DashboardSectionId[];
};

export type SavedViewFilter = {
  expiryStatus?: string;
  vendorQuery?: string;
};

export type SavedView = {
  id: string;
  name: string;
  filters: SavedViewFilter;
};

/** Normalized digest (minutes from midnight for quiet hours). Legacy fields may coexist. */
export type DigestPreferences = {
  frequency?: "daily" | "weekly" | "off";
  /** @deprecated Prefer `frequency` */
  emailFrequency?: "daily" | "weekly" | "off";
  quietHours?: { start: number; end: number };
  /** @deprecated Prefer `quietHours` */
  quietHoursStart?: string;
  /** @deprecated Prefer `quietHours` */
  quietHoursEnd?: string;
  inAppOnly?: boolean;
  inAppBanner?: boolean;
};

/** UX/marketing consent mirror (legal terms remain in `consents` table). */
export type UserConsentsPreferences = {
  termsAcceptedAt?: number;
  termsVersion?: string;
  marketingEmails?: boolean;
  productUpdates?: boolean;
  consentUpdatedAt?: number;
};

export type DeletionState = {
  status: "none" | "pending" | "completed";
  requestedAt?: number;
  completedAt?: number;
};

export type UserPreferencesDoc = {
  version?: number;
  consents?: UserConsentsPreferences;
  deletion?: DeletionState;
  dashboardLayout?: DashboardLayout;
  onboardingSteps?: Record<string, boolean>;
  savedViews?: SavedView[];
  digest?: DigestPreferences;
  milestones?: Record<string, number | boolean>;
  weeklySummarySnippet?: string;
  weeklySummaryAt?: number;
  updatedAt?: number;
};
