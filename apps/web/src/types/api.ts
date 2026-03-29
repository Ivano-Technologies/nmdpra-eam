export type MvpReportSummary = {
  total: number;
  expired: number;
  critical: number;
  warning: number;
  safe: number;
  expiringIn30Days: number;
};

export type MvpReportRow = {
  vendor: string;
  licenseType: string;
  expiryDate: string;
  status: string;
  expiryStatus: string;
  daysToExpiry: number;
};

export type MvpReportResponse = {
  generatedAt: string;
  summary: MvpReportSummary;
  rows: MvpReportRow[];
  topRiskVendors: Array<{ vendorName: string; riskScore: number }>;
};

export type RiskRankingRow = {
  vendorName: string;
  licenseType: string;
  expiryDate: string;
  expiryDateEnGb: string;
  riskScore: number;
  daysToExpiry: number;
};

export type ApiErrorBody = {
  error?: string;
  code?: string;
};
