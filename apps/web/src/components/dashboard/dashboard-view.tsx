"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import useSWR from "swr";
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from "recharts";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { ClientDashboardPlaceholder } from "@/components/dashboard/client-dashboard-placeholder";
import { DashboardCustomizePanel } from "@/components/dashboard/dashboard-customize-panel";
import { DigestPreferencesCard } from "@/components/dashboard/digest-preferences-card";
import {
  DashboardChartSkeleton,
  DashboardKpiSkeleton,
  DashboardSecondaryKpiSkeleton,
  DashboardTableSkeleton
} from "@/components/dashboard/dashboard-skeletons";
import { ExcelUploadCard } from "@/components/dashboard/excel-upload-card";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { OwnerPanel } from "@/components/dashboard/owner-panel";
import { ReportSubscriptionsCard } from "@/components/dashboard/report-subscriptions-card";
import { SavedViewsBar } from "@/components/dashboard/saved-views-bar";
import { TrustStrip } from "@/components/dashboard/trust-strip";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { mergeDashboardLayout } from "@/lib/dashboard-defaults";
import { illustrativeKpiTrend } from "@/lib/kpi-illustrative-trend";
import {
  filterMvpRows,
  filterRiskRows,
  summarizeMvpRows
} from "@/lib/saved-view-filters";
import { parseOrgId } from "@/lib/tenant";
import {
  hasPermission,
  parseUserRole,
  type Role
} from "@/lib/roles";
import type {
  ApiErrorBody,
  MvpReportResponse,
  RiskRankingRow
} from "@/types/api";
import type {
  DashboardLayout,
  DashboardSectionId,
  DigestPreferences,
  SavedView,
  SavedViewFilter
} from "@/types/user-preferences";

const STATUS_ORDER = ["EXPIRED", "CRITICAL", "WARNING", "SAFE"] as const;

function formatLastUpdated(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function labelForStatus(s: string): string {
  switch (s) {
    case "EXPIRED":
      return "Expired";
    case "CRITICAL":
      return "Critical";
    case "WARNING":
      return "Warning";
    case "SAFE":
      return "Safe";
    default:
      return s;
  }
}

function friendlyLoadError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("403") || m.includes("forbidden")) {
    return "You don’t have permission to load this data. Ask an owner to confirm your role.";
  }
  if (m.includes("503") || m.includes("not configured")) {
    return "The service is not fully configured (environment). Try again later or contact support.";
  }
  return message;
}

function aggregateExpiryCounts(rows: MvpReportResponse["rows"]) {
  const counts: Record<string, number> = {};
  for (const s of STATUS_ORDER) {
    counts[s] = 0;
  }
  for (const r of rows) {
    const key = r.expiryStatus;
    if (key in counts) {
      counts[key] += 1;
    }
  }
  return STATUS_ORDER.map((status) => ({
    name: labelForStatus(status),
    value: counts[status] ?? 0,
    status
  }));
}

function RiskInsightBanner({ mvp }: { mvp: MvpReportResponse }) {
  const n = mvp.summary.expiringIn30Days;
  const top = mvp.topRiskVendors?.[0];
  if (n <= 0 && !top) {
    return null;
  }
  return (
    <div className="border-border bg-muted/50 rounded-xl border px-4 py-4 text-sm shadow-sm transition-shadow duration-150 ring-1 ring-amber-500/15">
      <p className="text-foreground font-medium">Risk insight</p>
      <ul className="text-muted-foreground mt-2 space-y-1.5">
        {n > 0 ? (
          <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-amber-600 dark:text-amber-400" aria-hidden>
              !
            </span>
            <span>
              <span className="text-foreground font-medium">Attention: </span>
              {n} licence{n === 1 ? "" : "s"} require attention within 30 days
            </span>
            <Button variant="link" className="text-brand-gold h-auto p-0 text-sm" asChild>
              <Link href="#section-expiry-radar">Review expiries →</Link>
            </Button>
          </li>
        ) : null}
        {top ? (
          <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              <span className="text-foreground font-medium">
                Highest risk vendor:{" "}
              </span>
              {top.vendorName} (score: {top.riskScore})
            </span>
            <Button variant="link" className="text-brand-gold h-auto p-0 text-sm" asChild>
              <Link href="#section-risk-ranking">View risk table →</Link>
            </Button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function ExpiryBandLegend() {
  const items = [
    {
      label: "Expired (past due)",
      variant: "expired" as const,
      tip: "Licence end date is before today."
    },
    {
      label: "Critical (≤30 days)",
      variant: "warning" as const,
      tip: "Expires within 30 days — highest urgency."
    },
    {
      label: "Warning (31–60 days)",
      variant: "warning" as const,
      tip: "Expires in 31–60 days."
    },
    {
      label: "Safe (>60 days)",
      variant: "active" as const,
      tip: "More than 60 days until expiry."
    }
  ] as const;
  return (
    <ul
      className="text-muted-foreground flex list-none flex-wrap gap-x-4 gap-y-2 text-xs"
      aria-label="Expiry band meanings"
    >
      {items.map(({ label, variant, tip }) => (
        <li key={label} className="inline-flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                <StatusBadge variant={variant}>{label}</StatusBadge>
              </span>
            </TooltipTrigger>
            <TooltipContent>{tip}</TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}

const goldGlow =
  "drop-shadow-[0_0_6px_rgba(222,175,95,0.35)]";

const kpiToneClass: Record<
  "gold" | "critical" | "warning" | "positive" | "neutral",
  string
> = {
  gold: `text-brand-gold ${goldGlow}`,
  critical: "text-red-400",
  warning: "text-amber-400",
  positive: "text-[#b37c4b]",
  neutral: "text-card-foreground"
};

const cardLift =
  "transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30";

function KpiCard({
  label,
  value,
  hint,
  tone = "gold",
  delta,
  emphasis = false
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: keyof typeof kpiToneClass;
  /** Optional period-over-period hint (wire when API provides deltas). */
  delta?: { text: string; positive: boolean };
  /** Larger value + subtle ring for high-priority metrics (risk / expiry). */
  emphasis?: boolean;
}) {
  const labelText = (
    <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
  );
  const labelEl = hint ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help">{labelText}</div>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  ) : (
    <div>{labelText}</div>
  );
  return (
    <Card
      className={`border border-border bg-card shadow-lg shadow-black/20 ${cardLift} hover:border-muted-foreground/25 ${
        emphasis && tone === "critical"
          ? "ring-1 ring-red-500/30 shadow-red-950/20"
          : emphasis
            ? "ring-1 ring-amber-500/25"
            : ""
      }`}
    >
      <CardHeader className="space-y-1 pb-2">
        {labelEl}
        <div className="flex flex-wrap items-baseline gap-2">
          <CardTitle
            className={`font-heading tabular-nums leading-tight ${kpiToneClass[tone]} ${
              emphasis ? "text-4xl md:text-5xl" : "text-3xl"
            }`}
          >
            {value}
          </CardTitle>
          {delta ? (
            <span
              className={
                delta.positive ? "text-xs text-[#deaf5f]" : "text-xs text-red-400"
              }
              title="Illustrative trend (demo — replace when historical API is available)"
            >
              {delta.text}
            </span>
          ) : null}
        </div>
        <p className="text-[0.65rem] leading-tight text-muted-foreground">
          Current snapshot
        </p>
      </CardHeader>
    </Card>
  );
}

function WeeklyInsightCard({
  mvp,
  snippet
}: {
  mvp: MvpReportResponse | null;
  snippet?: string;
}) {
  const line = snippet
    ? snippet
    : mvp
      ? mvp.summary.expiringIn30Days > 0
        ? `${mvp.summary.expiringIn30Days} licence${mvp.summary.expiringIn30Days === 1 ? "" : "s"} will expire within 30 days — ${mvp.summary.critical} ${mvp.summary.critical === 1 ? "is" : "are"} high-risk.`
        : `Current snapshot: ${mvp.summary.critical} critical, ${mvp.summary.expired} expired licences (live data).`
      : "Weekly summaries and risk signals will appear here once licence data is loaded — connect uploads or wait for the next digest.";
  const showHighRiskCta = Boolean(mvp && mvp.summary.critical > 0);
  const showExpiryCta =
    Boolean(mvp && mvp.summary.expiringIn30Days > 0) && !showHighRiskCta;
  return (
    <Card
      className={`border border-border bg-card/90 shadow-lg shadow-black/20 ${cardLift}`}
    >
      <CardHeader className="py-3">
        <CardTitle
          className={`font-heading text-base font-medium text-brand-gold ${goldGlow}`}
        >
          Weekly insight
        </CardTitle>
        <CardDescription className="text-sm">{line}</CardDescription>
        {showHighRiskCta ? (
          <Button variant="link" className="text-emerald-400 mt-2 h-auto p-0 text-sm hover:text-emerald-300" asChild>
            <Link href="#section-risk-ranking">Review high-risk →</Link>
          </Button>
        ) : showExpiryCta ? (
          <Button variant="link" className="text-brand-gold mt-2 h-auto p-0 text-sm" asChild>
            <Link href="#section-expiry-radar">Review expiries →</Link>
          </Button>
        ) : null}
      </CardHeader>
    </Card>
  );
}

async function fetchAdminDashboard(getToken: () => Promise<string | null>): Promise<{
  mvp: MvpReportResponse;
  risk: RiskRankingRow[];
}> {
  const token = await getToken();
  const authHeaders: HeadersInit =
    token !== null && token !== ""
      ? { Authorization: `Bearer ${token}` }
      : {};
  const [mvpRes, riskRes] = await Promise.all([
    fetch("/api/reports/mvp", {
      cache: "no-store",
      headers: authHeaders
    }),
    fetch("/api/licenses/risk-ranking", {
      cache: "no-store",
      headers: authHeaders
    })
  ]);
  const mvpJson = (await mvpRes.json().catch(() => ({}))) as
    | { success: true; data: MvpReportResponse }
    | { success: false; error?: string }
    | ApiErrorBody;
  if (!mvpRes.ok) {
    const err =
      "error" in mvpJson && typeof mvpJson.error === "string"
        ? mvpJson.error
        : undefined;
    throw new Error(err ?? `MVP report failed (${mvpRes.status})`);
  }
  if (
    !("success" in mvpJson) ||
    mvpJson.success !== true ||
    !mvpJson.data
  ) {
    const err =
      "error" in mvpJson && typeof mvpJson.error === "string"
        ? mvpJson.error
        : "MVP report returned an invalid response";
    throw new Error(err);
  }
  if (!riskRes.ok) {
    const body = (await riskRes.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(body.error ?? `Risk ranking failed (${riskRes.status})`);
  }
  const risk = (await riskRes.json()) as RiskRankingRow[];
  return { mvp: mvpJson.data, risk };
}

export function DashboardView() {
  const { getToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const role: Role = parseUserRole(user?.publicMetadata);
  const canAdmin = hasPermission(role, "admin");
  const orgConfirmed = Boolean(parseOrgId(user?.publicMetadata));

  const { preferences, patchPreferences, patchDebounced } =
    useUserPreferences();

  const [customizeMode, setCustomizeMode] = useState(false);
  const [filter, setFilter] = useState<SavedViewFilter>({});
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  const mergedLayout = useMemo(
    () => mergeDashboardLayout(preferences?.dashboardLayout, role),
    [preferences?.dashboardLayout, role]
  );
  const [layoutState, setLayoutState] = useState<DashboardLayout>(mergedLayout);

  useEffect(() => {
    setLayoutState(mergedLayout);
  }, [mergedLayout]);

  const viewParam = searchParams?.get("view") ?? null;
  useEffect(() => {
    if (!viewParam || !preferences?.savedViews?.length) {
      return;
    }
    const v = preferences.savedViews.find((s) => s.id === viewParam);
    if (v) {
      setFilter(v.filters);
      setActiveViewId(v.id);
    }
  }, [viewParam, preferences?.savedViews]);

  useEffect(() => {
    if (typeof window === "undefined" || !userLoaded) {
      return;
    }
    if (pathname !== "/dashboard") {
      return;
    }
    if (window.location.hash.length > 1) {
      return;
    }
    const defaults: Partial<Record<Role, string>> = {
      client: "#section-client",
      admin: "#section-overview",
      owner: "#section-owner-metrics"
    };
    const target = defaults[role];
    if (target) {
      window.history.replaceState(
        null,
        "",
        `${pathname}${window.location.search}${target}`
      );
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  }, [userLoaded, pathname, role]);

  const swrKey = userLoaded && canAdmin ? "admin-dashboard" : null;
  const {
    data: adminData,
    error: swrError,
    isLoading,
    isValidating,
    mutate
  } = useSWR(
    swrKey,
    () => fetchAdminDashboard(getToken),
    { refreshInterval: 120_000, revalidateOnFocus: true }
  );

  const mvpRaw = adminData?.mvp ?? null;
  const riskRaw = adminData?.risk ?? null;
  const loadError = swrError
    ? swrError instanceof Error
      ? swrError.message
      : "Failed to load data"
    : null;

  const effectiveFilter = useMemo((): SavedViewFilter => {
    return { ...filter };
  }, [filter]);

  const displayMvp = useMemo(() => {
    if (!mvpRaw) {
      return null;
    }
    const rows = filterMvpRows(mvpRaw.rows, effectiveFilter);
    const summary = summarizeMvpRows(rows);
    const topRiskVendors =
      mvpRaw.topRiskVendors?.filter((t) =>
        rows.some((r) => r.vendor === t.vendorName)
      ) ?? mvpRaw.topRiskVendors;
    return {
      ...mvpRaw,
      rows,
      summary,
      topRiskVendors
    };
  }, [mvpRaw, effectiveFilter]);

  const displayRisk = useMemo(() => {
    if (!riskRaw) {
      return null;
    }
    return filterRiskRows(riskRaw, effectiveFilter);
  }, [riskRaw, effectiveFilter]);

  const chartData = useMemo(
    () => (displayMvp ? aggregateExpiryCounts(displayMvp.rows) : []),
    [displayMvp]
  );

  const chartIsEmpty = useMemo(() => {
    if (!displayMvp) {
      return true;
    }
    if (displayMvp.rows.length === 0) {
      return true;
    }
    return chartData.every((d) => d.value === 0);
  }, [displayMvp, chartData]);

  const vendorCount = useMemo(() => {
    if (!displayMvp?.rows.length) {
      return 0;
    }
    return new Set(displayMvp.rows.map((r) => r.vendor)).size;
  }, [displayMvp]);

  const activePct = useMemo(() => {
    if (!displayMvp || displayMvp.summary.total <= 0) {
      return 0;
    }
    return Math.round(
      (displayMvp.summary.safe / displayMvp.summary.total) * 100
    );
  }, [displayMvp]);

  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";

  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "ok" | "err"
  >("idle");
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  const sendEmail = async () => {
    setEmailMessage(null);
    const to = userEmail.trim();
    if (!to) {
      setEmailStatus("err");
      setEmailMessage("No email on your account. Add an email in Clerk.");
      return;
    }
    setEmailStatus("sending");
    try {
      const token = await getToken();
      const res = await fetch("/api/reports/mvp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ to })
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(body.error ?? `Email failed (${res.status})`);
      }
      setEmailStatus("ok");
      setEmailMessage("Report sent. Check your inbox.");
    } catch (e) {
      setEmailStatus("err");
      setEmailMessage(e instanceof Error ? e.message : "Email failed");
    }
  };

  const pdfHref = "/api/reports/mvp.pdf";

  const handleUploadSuccess = useCallback(async () => {
    const had = preferences?.milestones?.firstUploadAt;
    try {
      await patchPreferences({
        milestones: { firstUploadAt: Date.now() },
        onboardingSteps: { firstUpload: true, orgConfirmed: true }
      });
      if (!had) {
        toast.success("First upload recorded — great start.");
      }
    } catch {
      /* ignore */
    }
    void mutate();
  }, [patchPreferences, preferences?.milestones?.firstUploadAt, mutate]);

  const handleSubscriptionSaved = useCallback(async () => {
    try {
      await patchPreferences({
        onboardingSteps: { reportSubscriptionVerified: true }
      });
    } catch {
      /* ignore */
    }
  }, [patchPreferences]);

  const saveLayoutNow = useCallback(() => {
    void patchPreferences({ dashboardLayout: layoutState });
    toast.success("Dashboard layout saved");
  }, [patchPreferences, layoutState]);

  const onApplyView = useCallback((view: SavedView | null) => {
    if (!view) {
      setFilter({});
      setActiveViewId(null);
      return;
    }
    setFilter(view.filters);
    setActiveViewId(view.id);
  }, []);

  const onSaveView = useCallback(
    (name: string, filters: SavedViewFilter) => {
      const id = crypto.randomUUID();
      const next: SavedView[] = [
        ...(preferences?.savedViews ?? []),
        { id, name, filters }
      ];
      void patchPreferences({ savedViews: next }).then(() => {
        setActiveViewId(id);
        router.replace(`/dashboard?view=${encodeURIComponent(id)}`, {
          scroll: false
        });
        toast.success("Saved view added");
      });
    },
    [patchPreferences, preferences?.savedViews, router]
  );

  const visibleSections = useMemo(() => {
    return layoutState.order.filter((id) => !layoutState.hidden.includes(id));
  }, [layoutState]);

  const [digestSaving, setDigestSaving] = useState(false);
  const saveDigest = useCallback(
    async (d: DigestPreferences) => {
      setDigestSaving(true);
      try {
        await patchPreferences({ digest: d });
        toast.success("Digest preferences saved");
      } catch {
        toast.error("Could not save digest preferences");
      } finally {
        setDigestSaving(false);
      }
    },
    [patchPreferences]
  );

  const renderSection = (sectionId: DashboardSectionId) => {
    switch (sectionId) {
      case "data-upload":
        return (
          <ExcelUploadCard
            key="data-upload"
            onUploadSuccess={handleUploadSuccess}
          />
        );
      case "overview":
        if (!displayMvp) {
          return null;
        }
        return (
          <section
            key="overview"
            id="section-overview"
            className="scroll-mt-28 space-y-6"
          >
            <h2
              className={`font-heading text-lg text-brand-gold ${goldGlow} mb-2`}
            >
              Risk overview
            </h2>
            <RiskInsightBanner mvp={displayMvp} />
            <div className="space-y-6 rounded-xl border border-border bg-card/80 p-6 shadow-lg shadow-black/20">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Total licences"
                value={displayMvp.summary.total}
                hint="All licence rows in the current filtered set"
                delta={illustrativeKpiTrend("Total licences", displayMvp.summary.total)}
              />
              <KpiCard
                label="Expiring soon"
                value={displayMvp.summary.expiringIn30Days}
                hint={`${displayMvp.summary.expiringIn30Days} expiring within 30 days — ${displayMvp.summary.critical} require immediate action (critical risk)`}
                tone="warning"
                emphasis
                delta={illustrativeKpiTrend(
                  "Expiring soon",
                  displayMvp.summary.expiringIn30Days
                )}
              />
              <KpiCard
                label="Expired"
                value={displayMvp.summary.expired}
                hint="Past due"
                delta={illustrativeKpiTrend("Expired", displayMvp.summary.expired)}
              />
              <KpiCard
                label="Active %"
                value={`${activePct}%`}
                hint="Share in “safe” band within current filters"
                delta={illustrativeKpiTrend("Active %", activePct)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Critical (≤30 days)"
                value={displayMvp.summary.critical}
                hint="Secondary KPI"
                tone="critical"
                emphasis
                delta={illustrativeKpiTrend(
                  "Critical (≤30 days)",
                  displayMvp.summary.critical
                )}
              />
              <KpiCard
                label="Warning (31–60 days)"
                value={displayMvp.summary.warning}
                hint="Secondary KPI"
                tone="warning"
                delta={illustrativeKpiTrend(
                  "Warning (31–60 days)",
                  displayMvp.summary.warning
                )}
              />
              <KpiCard
                label="Safe (&gt;60 days)"
                value={displayMvp.summary.safe}
                hint="Secondary KPI"
                tone="positive"
                delta={illustrativeKpiTrend(
                  "Safe (>60 days)",
                  displayMvp.summary.safe
                )}
              />
              <KpiCard
                label="Vendors"
                value={vendorCount}
                hint="Distinct vendors in filtered report"
                tone="gold"
                delta={illustrativeKpiTrend("Vendors", vendorCount)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">Coverage: </span>
              {displayMvp.summary.total} licence
              {displayMvp.summary.total === 1 ? "" : "s"} across {vendorCount}{" "}
              vendor{vendorCount === 1 ? "" : "s"}
            </p>
            </div>
          </section>
        );
      case "expiry-radar":
        if (!displayMvp) {
          return null;
        }
        return (
          <Card
            key="expiry-radar"
            id="section-expiry-radar"
            className={`scroll-mt-28 border border-border bg-card shadow-lg shadow-black/20 ${cardLift} hover:border-muted-foreground/25`}
          >
            <CardHeader className="space-y-3">
              <div>
                <CardTitle
                  className={`font-heading text-xl font-medium text-brand-gold ${goldGlow}`}
                >
                  Expiry radar
                </CardTitle>
                <CardDescription>
                  Licence rows by expiry band (filtered dataset).
                </CardDescription>
              </div>
              <ExpiryBandLegend />
            </CardHeader>
            <CardContent className="h-72">
              {chartIsEmpty ? (
                <p className="text-muted-foreground flex h-full items-center justify-center text-center text-sm">
                  No data available for this chart.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 8 }}
                      formatter={(value) => [Number(value ?? 0), "Licences"]}
                    />
                    <Bar
                      dataKey="value"
                      fill="#deaf5f"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        );
      case "weekly-insight":
        return (
          <div key="weekly-insight" id="section-weekly-insight" className="scroll-mt-28">
            <WeeklyInsightCard
              mvp={mvpRaw}
              snippet={preferences?.weeklySummarySnippet}
            />
          </div>
        );
      case "risk-ranking":
        return (
          <Card
            key="risk-ranking"
            id="section-risk-ranking"
            className={`scroll-mt-28 min-h-[22rem] border border-border bg-card shadow-lg shadow-black/30 shadow-red-950/10 ${cardLift} ring-1 ring-border hover:border-muted-foreground/25`}
          >
            <CardHeader>
              <CardTitle
                className={`font-heading text-2xl font-semibold text-brand-gold md:text-3xl ${goldGlow}`}
              >
                Risk ranking
              </CardTitle>
              <CardDescription>
                Vendors sorted by risk score (highest first); filtered by saved
                view.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {displayRisk && displayRisk.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">Risk score</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Higher scores need more attention first.
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead>Expiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_tr:nth-child(even)]:bg-muted/40">
                    {displayRisk.slice(0, 50).map((row, i) => (
                      <TableRow
                        key={`${row.vendorName}-${row.expiryDate}-${i}`}
                        className="transition-colors duration-150"
                      >
                        <TableCell className="font-medium">
                          {row.vendorName}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.riskScore}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.expiryDateEnGb}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No data available.
                </p>
              )}
            </CardContent>
          </Card>
        );
      case "reports":
        return (
          <Card
            key="reports"
            id="section-reports"
            className={`scroll-mt-28 border border-border bg-card shadow-lg shadow-black/20 ${cardLift} hover:border-muted-foreground/25`}
          >
            <CardHeader>
              <CardTitle
                className={`font-heading text-xl font-medium text-brand-gold ${goldGlow}`}
              >
                Reports
              </CardTitle>
              <CardDescription>
                Download PDF or email the current MVP report.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-3">
                <Button size="lg" variant="outline" asChild>
                  <a href={pdfHref} target="_blank" rel="noreferrer">
                    Download PDF
                  </a>
                </Button>
                <Button
                  size="lg"
                  type="button"
                  disabled={emailStatus === "sending" || !userEmail}
                  onClick={() => void sendEmail()}
                >
                  {emailStatus === "sending" ? "Sending…" : "Send email"}
                </Button>
              </div>
              {emailStatus === "sending" ? (
                <p className="text-muted-foreground text-sm">
                  Sending report…
                </p>
              ) : null}
            </CardContent>
            {emailMessage ? (
              <CardContent className="pt-0">
                <p
                  className={
                    emailStatus === "ok"
                      ? "text-sm text-emerald-600 dark:text-emerald-400"
                      : "text-destructive text-sm"
                  }
                >
                  {emailMessage}
                </p>
              </CardContent>
            ) : null}
          </Card>
        );
      case "owner-panel":
        if (role !== "owner") {
          return null;
        }
        return (
          <div
            key="owner-panel"
            id="section-owner-panel"
            className="scroll-mt-28 space-y-8"
          >
            <OwnerPanel />
            <ReportSubscriptionsCard
              onSubscriptionSaved={handleSubscriptionSaved}
            />
            <DigestPreferencesCard
              key={preferences?.updatedAt ?? "digest"}
              digest={preferences?.digest}
              saving={digestSaving}
              onSave={saveDigest}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (!userLoaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48 rounded-md bg-muted" />
        <DashboardKpiSkeleton />
        <DashboardSecondaryKpiSkeleton />
        <DashboardChartSkeleton />
        <DashboardTableSkeleton />
      </div>
    );
  }

  if (!canAdmin) {
    return <ClientDashboardPlaceholder />;
  }

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Licence intelligence overview — data from live API.
          </p>
          <TrustStrip generatedAtIso={mvpRaw?.generatedAt} role={role} />
          {mvpRaw && !isLoading ? (
            <p className="text-foreground mt-2 flex flex-wrap items-center gap-2 text-sm font-medium">
              <span>Last updated: {formatLastUpdated(mvpRaw.generatedAt)}</span>
              {isValidating ? (
                <span className="text-muted-foreground font-normal">
                  Updating…
                </span>
              ) : null}
            </p>
          ) : null}
        </div>

        <OnboardingChecklist
          preferences={preferences}
          termsAccepted
          orgConfirmed={orgConfirmed}
          onDismiss={() => {
            void patchPreferences({
              onboardingSteps: { checklistDismissed: true }
            });
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={customizeMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => setCustomizeMode((c) => !c)}
          >
            {customizeMode ? "Done customizing" : "Customize layout"}
          </Button>
        </div>

        {customizeMode ? (
          <DashboardCustomizePanel
            layout={layoutState}
            onChange={(next) => {
              setLayoutState(next);
              patchDebounced({ dashboardLayout: next });
            }}
            onSave={saveLayoutNow}
          />
        ) : null}

        <SavedViewsBar
          savedViews={preferences?.savedViews}
          filter={filter}
          onFilterChange={(next) => {
            setFilter(next);
            setActiveViewId(null);
          }}
          activeViewId={activeViewId}
          onApplyView={onApplyView}
          onSaveView={onSaveView}
        />

        {loadError ? (
          <Card className="border-destructive/40 transition-shadow duration-150">
            <CardHeader>
              <CardTitle className="text-destructive text-xl font-medium">
                Failed to load — retry
              </CardTitle>
              <CardDescription>
                {friendlyLoadError(loadError)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={() => void mutate()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <div className="space-y-6">
            <p className="text-muted-foreground text-sm">Loading dashboard…</p>
            <DashboardKpiSkeleton />
            <DashboardSecondaryKpiSkeleton />
            <DashboardChartSkeleton />
            <DashboardTableSkeleton />
          </div>
        ) : (
          <>
            {!mvpRaw && !loadError ? (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-xl font-medium">
                    No report data yet
                  </CardTitle>
                  <CardDescription>
                    Upload a licence file to generate your first MVP report and
                    charts.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" asChild>
                    <a href="#section-data-upload">Upload your first file</a>
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            <div className="space-y-6">
              {visibleSections.map((id) => renderSection(id))}
            </div>
          </>
        )}
      </div>
  );
}
