"use client";

import { useAuth } from "@clerk/nextjs";
import { Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { DataControlCard } from "@/components/dashboard/data-control-card";
import { UserRoleManager } from "@/components/dashboard/user-role-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type AuditEntry = {
  id: string;
  action: string;
  actorUserId: string;
  targetUserId?: string;
  metadata?: unknown;
  createdAt: number;
};

function formatAuditTime(ts: number): string {
  return new Date(ts).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function OwnerMetricsCard() {
  const { getToken } = useAuth();
  const [vendorCount, setVendorCount] = useState<number | null>(null);
  const [licenseCount, setLicenseCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/owner/metrics", {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const body = (await res.json().catch(() => ({}))) as {
        vendorCount?: number | null;
        licenseCount?: number | null;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? `Metrics failed (${res.status})`);
      }
      if (body.error) {
        setVendorCount(null);
        setLicenseCount(null);
        setError(body.error);
        return;
      }
      setVendorCount(
        typeof body.vendorCount === "number" ? body.vendorCount : null
      );
      setLicenseCount(
        typeof body.licenseCount === "number" ? body.licenseCount : null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load metrics");
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card id="section-owner-metrics" className="scroll-mt-28">
      <CardHeader>
        <CardTitle>System metrics</CardTitle>
        <CardDescription>
          Convex snapshot (vendors and licence rows). Requires{" "}
          <span className="text-foreground font-medium">AUDIT_SECRET</span> on
          the server.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-muted-foreground text-sm">{error}</p>
        ) : vendorCount === null && licenseCount === null ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground text-xs">Vendors</dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {vendorCount ?? "—"}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground text-xs">Licences</dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {licenseCount ?? "—"}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

function AccessLogsCard() {
  const { getToken } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/audit-logs?limit=50", {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const body = (await res.json().catch(() => ({}))) as {
        entries?: AuditEntry[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? `Audit logs failed (${res.status})`);
      }
      setEntries(body.entries ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load access logs");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card id="section-owner-audit" className="scroll-mt-28">
      <CardHeader>
        <CardTitle>Access logs</CardTitle>
        <CardDescription>
          Recent governance events (e.g. role changes). Owner-only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : null}
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No audit entries yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr:nth-child(even)]:bg-muted/40">
                {entries.map((e) => (
                  <TableRow
                    key={e.id}
                    className="transition-colors duration-150"
                  >
                    <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                      {formatAuditTime(e.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{e.action}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {e.actorUserId}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {e.targetUserId ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function OwnerPanel() {
  return (
    <section className="space-y-8" aria-labelledby="owner-workspace-heading">
      <div className="space-y-1">
        <h2
          id="owner-workspace-heading"
          className="text-muted-foreground flex items-center gap-2 text-xl font-medium"
        >
          <Users className="text-foreground size-5" aria-hidden />
          Owner workspace
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          User roles, system metrics, and access logs — owner-only.
        </p>
      </div>
      <UserRoleManager />
      <DataControlCard />
      <OwnerMetricsCard />
      <AccessLogsCard />
    </section>
  );
}
