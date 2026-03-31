"use client";

import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { SystemStatus } from "@/components/dashboard/system-status";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type {
  ApiErrorBody,
  MvpReportResponse,
  RiskRankingRow
} from "@/types/api";

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
    <div className="border-border bg-muted/50 rounded-lg border px-4 py-3 text-sm">
      <p className="text-foreground font-medium">Risk insight</p>
      <ul className="text-muted-foreground mt-2 space-y-1.5">
        {n > 0 ? (
          <li className="flex gap-2">
            <span className="text-amber-600 dark:text-amber-400" aria-hidden>
              !
            </span>
            <span>
              <span className="text-foreground font-medium">Attention: </span>
              {n} licence{n === 1 ? "" : "s"} require attention within 30 days
            </span>
          </li>
        ) : null}
        {top ? (
          <li>
            <span className="text-foreground font-medium">
              Highest risk vendor:{" "}
            </span>
            {top.vendorName} (score: {top.riskScore})
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function ExpiryBandLegend() {
  const items = [
    { label: "Expired (past due)", className: "bg-zinc-500" },
    { label: "Critical (≤30 days)", className: "bg-red-500" },
    { label: "Warning (31–60 days)", className: "bg-amber-500" },
    { label: "Safe (>60 days)", className: "bg-emerald-600" }
  ] as const;
  return (
    <ul
      className="text-muted-foreground flex list-none flex-wrap gap-x-4 gap-y-1 text-xs"
      aria-label="Expiry band meanings"
    >
      {items.map(({ label, className }) => (
        <li key={label} className="inline-flex items-center gap-1.5">
          <span
            className={`size-2 shrink-0 rounded-full ${className}`}
            aria-hidden
          />
          {label}
        </li>
      ))}
    </ul>
  );
}

function DashboardSectionNav() {
  const links = [
    { href: "#section-overview", label: "Overview" },
    { href: "#section-expiry-radar", label: "Expiry radar" },
    { href: "#section-risk-ranking", label: "Risk ranking" },
    { href: "#section-reports", label: "Reports" }
  ] as const;
  return (
    <nav
      className="border-border flex flex-wrap gap-x-4 gap-y-1 border-b pb-3 text-sm"
      aria-label="Jump to dashboard section"
    >
      {links.map(({ href, label }) => (
        <a
          key={href}
          href={href}
          className="text-primary hover:underline underline-offset-4"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

export function DashboardView() {
  const { getToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [mvp, setMvp] = useState<MvpReportResponse | null>(null);
  const [risk, setRisk] = useState<RiskRankingRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "ok" | "err"
  >("idle");
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const authHeaders: HeadersInit =
        token !== null && token !== ""
          ? { Authorization: `Bearer ${token}` }
          : {};
      // Same-origin `/api/*`; Bearer lets Pages API `getAuth(req)` resolve the session reliably.
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
      setMvp(mvpJson.data);
      if (!riskRes.ok) {
        const body = (await riskRes.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(body.error ?? `Risk ranking failed (${riskRes.status})`);
      }
      setRisk((await riskRes.json()) as RiskRankingRow[]);
    } catch (e) {
      setMvp(null);
      setRisk(null);
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = useMemo(
    () => (mvp ? aggregateExpiryCounts(mvp.rows) : []),
    [mvp]
  );

  const chartIsEmpty = useMemo(() => {
    if (!mvp) return true;
    if (mvp.rows.length === 0) return true;
    return chartData.every((d) => d.value === 0);
  }, [mvp, chartData]);

  const vendorCount = useMemo(() => {
    if (!mvp?.rows.length) return 0;
    return new Set(mvp.rows.map((r) => r.vendor)).size;
  }, [mvp]);

  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";

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

  if (!userLoaded) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-full flex-1 flex-col">
      <header className="border-b bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">RMLIS</span>
              <SystemStatus />
            </div>
            <p className="text-muted-foreground text-xs leading-snug">
              Regulatory Intelligence System (RMLIS)
            </p>
            <p className="text-muted-foreground text-xs">Prepared for: NMDPRA</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Home</Link>
            </Button>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-8 p-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Licence intelligence overview — data from live API.
          </p>
          {mvp && !loading ? (
            <>
              <p className="text-foreground mt-2 text-sm font-medium">
                Last updated: {formatLastUpdated(mvp.generatedAt)}
              </p>
              <div className="mt-4">
                <DashboardSectionNav />
              </div>
            </>
          ) : null}
        </div>

        {error ? (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">
                Unable to load compliance data
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={() => void load()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Fetching latest compliance data…
            </p>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
              <Skeleton className="h-72 md:col-span-3 lg:col-span-6" />
              <Skeleton className="h-64 md:col-span-3 lg:col-span-6" />
            </div>
          </div>
        ) : mvp ? (
          <>
            <section
              id="section-overview"
              className="scroll-mt-28 space-y-4"
            >
              <RiskInsightBanner mvp={mvp} />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <KpiCard label="Total licences" value={mvp.summary.total} />
                <KpiCard
                  label="Expired (past due)"
                  value={mvp.summary.expired}
                />
                <KpiCard
                  label="Critical (≤30 days)"
                  value={mvp.summary.critical}
                />
                <KpiCard
                  label="Warning (31–60 days)"
                  value={mvp.summary.warning}
                />
                <KpiCard label="Safe (>60 days)" value={mvp.summary.safe} />
                <KpiCard
                  label="Licences expiring in next 30 days"
                  value={mvp.summary.expiringIn30Days}
                />
              </div>

              <p className="text-muted-foreground text-sm">
                <span className="text-foreground font-medium">Coverage: </span>
                {mvp.summary.total} licence{mvp.summary.total === 1 ? "" : "s"}{" "}
                across {vendorCount} vendor{vendorCount === 1 ? "" : "s"}
              </p>
            </section>

            <Card id="section-expiry-radar" className="scroll-mt-28">
              <CardHeader className="space-y-3">
                <div>
                  <CardTitle>Expiry radar</CardTitle>
                  <CardDescription>
                    Licence rows by expiry band (from MVP report dataset).
                  </CardDescription>
                </div>
                <ExpiryBandLegend />
              </CardHeader>
              <CardContent className="h-72">
                {chartIsEmpty ? (
                  <p className="text-muted-foreground flex h-full items-center justify-center text-center text-sm">
                    No licence rows in this report for the expiry radar.
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
                      <Tooltip
                        contentStyle={{ borderRadius: 8 }}
                        formatter={(value) => [Number(value ?? 0), "Licences"]}
                      />
                      <Bar
                        dataKey="value"
                        fill="#64748b"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card id="section-risk-ranking" className="scroll-mt-28">
              <CardHeader>
                <CardTitle>Risk ranking</CardTitle>
                <CardDescription>
                  Vendors sorted by risk score (highest first).
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {risk && risk.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead className="text-right">Risk score</TableHead>
                        <TableHead>Expiry</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {risk.slice(0, 50).map((row, i) => (
                        <TableRow
                          key={`${row.vendorName}-${row.expiryDate}-${i}`}
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
                    No high-risk vendors detected in this dataset.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card id="section-reports" className="scroll-mt-28">
              <CardHeader>
                <CardTitle>Reports</CardTitle>
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
          </>
        ) : null}
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs leading-snug">{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
        <p className="text-muted-foreground pt-1 text-[0.65rem] leading-tight">
          Current snapshot
        </p>
      </CardHeader>
    </Card>
  );
}
