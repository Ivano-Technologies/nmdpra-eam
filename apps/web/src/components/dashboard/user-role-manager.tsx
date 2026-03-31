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
import { type Role } from "@/lib/roles";

const PAGE_SIZE = 20;

type ListedUser = {
  id: string;
  email: string | null;
  role: Role;
  lastSignInAt: string | null;
};

type UsersApiResponse = {
  users: ListedUser[];
  totalCount: number;
  limit: number;
  offset: number;
};

function formatLastLogin(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function UserRoleManager() {
  const { getToken } = useAuth();
  const [rows, setRows] = useState<ListedUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  /** pending role per user id before Save */
  const [draftRoles, setDraftRoles] = useState<Record<string, Role>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowMessage, setRowMessage] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const token = await getToken();
      const res = await fetch(
        `/api/users?limit=${PAGE_SIZE}&offset=${offset}`,
        {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      const body = (await res.json().catch(() => ({}))) as UsersApiResponse & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? `Failed to load users (${res.status})`);
      }
      setRows(body.users ?? []);
      setTotalCount(body.totalCount ?? 0);
      setDraftRoles((prev) => {
        const next = { ...prev };
        for (const u of body.users ?? []) {
          if (next[u.id] === undefined) {
            next[u.id] = u.role;
          }
        }
        return next;
      });
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load users");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveRole = async (targetUserId: string) => {
    const newRole = draftRoles[targetUserId];
    if (!newRole) {
      return;
    }
    setSavingId(targetUserId);
    setRowMessage((m) => ({ ...m, [targetUserId]: "" }));
    try {
      const token = await getToken();
      const res = await fetch("/api/users/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ targetUserId, newRole })
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? `Save failed (${res.status})`);
      }
      toast.success("Role updated");
      setRowMessage((m) => ({
        ...m,
        [targetUserId]: ""
      }));
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      toast.error(msg);
      setRowMessage((m) => ({
        ...m,
        [targetUserId]: msg
      }));
    } finally {
      setSavingId(null);
    }
  };

  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < totalCount;

  return (
    <Card
      id="section-owner-users"
      className="scroll-mt-28 transition-shadow duration-150 hover:shadow-md"
    >
      <CardHeader>
        <CardTitle className="text-xl font-medium">User role management</CardTitle>
        <CardDescription>
          Owner-only: users from Clerk with role from{" "}
          <span className="text-foreground font-medium">publicMetadata.role</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {listError ? (
          <p className="text-destructive text-sm">{listError}</p>
        ) : null}
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading users…</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last login</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:nth-child(even)]:bg-muted/40">
                  {rows.map((u) => (
                    <TableRow
                      key={u.id}
                      className="transition-colors duration-150"
                    >
                      <TableCell className="font-medium">
                        {u.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        <select
                          className="border-input bg-background h-9 w-full min-w-[7rem] rounded-md border border-neutral-200 px-2 text-sm dark:border-neutral-700"
                          aria-label={`Role for ${u.email ?? u.id}`}
                          value={draftRoles[u.id] ?? u.role}
                          onChange={(e) =>
                            setDraftRoles((d) => ({
                              ...d,
                              [u.id]: e.target.value as Role
                            }))
                          }
                        >
                          <option value="client">Client</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatLastLogin(u.lastSignInAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            disabled={
                              savingId === u.id ||
                              (draftRoles[u.id] ?? u.role) === u.role
                            }
                            onClick={() => void saveRole(u.id)}
                          >
                            {savingId === u.id ? "Saving…" : "Save"}
                          </Button>
                          {rowMessage[u.id] ? (
                            <span className="text-muted-foreground max-w-[12rem] break-words text-xs">
                              {rowMessage[u.id]}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {totalCount === 0
                  ? "No users"
                  : `Showing ${offset + 1}–${Math.min(offset + rows.length, offset + PAGE_SIZE)} of ${totalCount}`}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasPrev || loading}
                  onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasNext || loading}
                  onClick={() => setOffset((o) => o + PAGE_SIZE)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
