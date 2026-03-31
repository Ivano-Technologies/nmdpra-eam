"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { Role } from "@/lib/roles";

export function UserRoleManager() {
  const { getToken } = useAuth();
  const [targetUserId, setTargetUserId] = useState("");
  const [newRole, setNewRole] = useState<Role>("client");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const assign = async () => {
    setMessage(null);
    const id = targetUserId.trim();
    if (!id) {
      setStatus("err");
      setMessage("Enter the target user’s Clerk ID.");
      return;
    }
    setStatus("loading");
    try {
      const token = await getToken();
      const res = await fetch("/api/users/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ targetUserId: id, newRole })
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setStatus("ok");
      setMessage("Role updated.");
      setTargetUserId("");
    } catch (e) {
      setStatus("err");
      setMessage(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <Card id="section-owner-users" className="scroll-mt-28">
      <CardHeader>
        <CardTitle>User role management</CardTitle>
        <CardDescription>
          Owner-only: set <span className="text-foreground font-medium">publicMetadata.role</span>{" "}
          for another user. Copy the user ID from Clerk Dashboard → Users.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex max-w-lg flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Target user ID</span>
          <input
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            placeholder="user_..."
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">New role</span>
          <select
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
          >
            <option value="client">Client</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
        </label>
        <Button
          type="button"
          disabled={status === "loading"}
          onClick={() => void assign()}
        >
          {status === "loading" ? "Saving…" : "Assign role"}
        </Button>
        {message ? (
          <p
            className={
              status === "ok"
                ? "text-sm text-emerald-600 dark:text-emerald-400"
                : "text-destructive text-sm"
            }
          >
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
