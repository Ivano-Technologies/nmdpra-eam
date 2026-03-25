type LicenseOverviewSnapshot = {
  message: string;
  generatedAt: string;
};

type LicenseRecord = {
  id: string;
  vendorId: string;
  licenseType: string;
  issueDate: string;
  expiryDate: string;
  status: string;
};

type ExpiryStatus = "EXPIRED" | "CRITICAL" | "WARNING" | "SAFE";

type ExpiringLicense = {
  id: string;
  vendorId: string;
  licenseType: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  daysToExpiry: number;
  expiryStatus: ExpiryStatus;
};

export type ExpiringLicensesResponse = {
  expired: ExpiringLicense[];
  critical: ExpiringLicense[];
  warning: ExpiringLicense[];
};

const mockLicenses: LicenseRecord[] = [
  {
    id: "lic-001",
    vendorId: "vendor-001",
    licenseType: "Operations Permit",
    issueDate: "2025-01-15",
    expiryDate: "2026-02-20",
    status: "active"
  },
  {
    id: "lic-002",
    vendorId: "vendor-002",
    licenseType: "Safety Certification",
    issueDate: "2025-06-01",
    expiryDate: "2026-04-10",
    status: "active"
  },
  {
    id: "lic-003",
    vendorId: "vendor-003",
    licenseType: "Environmental Clearance",
    issueDate: "2025-03-20",
    expiryDate: "2026-05-15",
    status: "active"
  },
  {
    id: "lic-004",
    vendorId: "vendor-004",
    licenseType: "Import Authorization",
    issueDate: "2025-10-05",
    expiryDate: "2026-09-30",
    status: "active"
  }
];

const DAY_IN_MS = 1000 * 60 * 60 * 24;

const toUtcMidnight = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

const computeDaysToExpiry = (expiryDate: string, now: Date): number => {
  const expiry = toUtcMidnight(new Date(expiryDate));
  const today = toUtcMidnight(now);
  return Math.round((expiry.getTime() - today.getTime()) / DAY_IN_MS);
};

const computeExpiryStatus = (daysToExpiry: number): ExpiryStatus => {
  if (daysToExpiry < 0) return "EXPIRED";
  if (daysToExpiry <= 30) return "CRITICAL";
  if (daysToExpiry <= 60) return "WARNING";
  return "SAFE";
};

export const getOverviewSnapshot = async (): Promise<LicenseOverviewSnapshot> => {
  return {
    message: "License overview placeholder",
    generatedAt: new Date().toISOString()
  };
};

export const getExpiringLicenses = async (
  now: Date = new Date()
): Promise<ExpiringLicensesResponse> => {
  const normalized = mockLicenses.map<ExpiringLicense>((license) => {
    const daysToExpiry = computeDaysToExpiry(license.expiryDate, now);
    return {
      ...license,
      daysToExpiry,
      expiryStatus: computeExpiryStatus(daysToExpiry)
    };
  });

  return {
    expired: normalized.filter((license) => license.expiryStatus === "EXPIRED"),
    critical: normalized.filter((license) => license.expiryStatus === "CRITICAL"),
    warning: normalized.filter((license) => license.expiryStatus === "WARNING")
  };
};
