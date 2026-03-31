"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

type SubRow = {
  id: string;
  orgId: string;
  email: string;
  frequency: string;
  createdAt: number;
  lastSentAt?: number;
};

export function ReportSubscriptionsCard() {
  const { getToken } = useAuth();
  const [rows, setRows] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
    "weekly"
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/report-subscriptions", {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const body = (await res.json().catch(() => ({}))) as {
        subscriptions?: SubRow[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? String(res.status));
      }
      setRows(body.subscriptions ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (!orgId.trim() || !email.trim()) {
      toast.error("orgId and email are required");
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch("/api/report-subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          orgId: orgId.trim(),
          email: email.trim(),
          frequency
        })
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "Save failed");
      }
      toast.success("Subscription saved");
      setOrgId("");
      setEmail("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const remove = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(
        `/api/report-subscriptions?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Delete failed");
      }
      toast.success("Removed");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <Card
      id="section-report-subscriptions"
      className="scroll-mt-28 transition-shadow duration-150 hover:shadow-md"
    >
      <CardHeader>
        <CardTitle className="text-xl font-medium">
          Report email subscriptions
        </CardTitle>
        <CardDescription>
          Owner-only: scheduled compliance emails per org (cron uses{" "}
          <span className="text-foreground font-medium">/api/cron/send-reports</span>
          ).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="orgId"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="border-input bg-background min-w-[8rem] rounded-md border px-2 py-1.5 text-sm"
          />
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-input bg-background min-w-[12rem] rounded-md border px-2 py-1.5 text-sm"
          />
          <select
            value={frequency}
            onChange={(e) =>
              setFrequency(e.target.value as typeof frequency)
            }
            className="border-input bg-background rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
          </select>
          <Button type="button" size="sm" onClick={() => void add()}>
            Add / update
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No subscriptions yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Org</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">
                      {r.orgId}
                    </TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.frequency}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void remove(r.id)}
                      >
                        Remove
                      </Button>
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
