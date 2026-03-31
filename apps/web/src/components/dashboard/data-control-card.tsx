"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { parseOrgId } from "@/lib/tenant";

export function DataControlCard() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const metaOrg = parseOrgId(user?.publicMetadata);
  const [orgIdInput, setOrgIdInput] = useState("");
  const needsOrgField = !metaOrg;
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const onDelete = useCallback(async () => {
    if (confirmText !== "DELETE") {
      toast.error('Type DELETE in the box to confirm.');
      return;
    }
    if (needsOrgField && !orgIdInput.trim()) {
      toast.error("Enter your organization ID to confirm the target tenant.");
      return;
    }
    if (
      !globalThis.window?.confirm(
        "This permanently deletes all organization data in Convex and uploaded files for this org. This cannot be undone. Continue?"
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/org/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          confirmPhrase: "DELETE",
          ...(needsOrgField && orgIdInput.trim()
            ? { orgId: orgIdInput.trim() }
            : {})
        })
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        vendorsDeleted?: number;
        licensesDeleted?: number;
        blobsDeleted?: number;
      };
      if (!res.ok) {
        throw new Error(body.error ?? `Delete failed (${res.status})`);
      }
      toast.success(
        `Organization data removed (vendors: ${body.vendorsDeleted ?? 0}, licences: ${body.licensesDeleted ?? 0}, blobs: ${body.blobsDeleted ?? 0}).`
      );
      setConfirmText("");
      globalThis.window?.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deletion failed");
    } finally {
      setDeleting(false);
    }
  }, [confirmText, getToken, needsOrgField, orgIdInput]);

  return (
    <Card
      id="section-data-control"
      className="scroll-mt-28 border-destructive/30 transition-shadow duration-150 hover:shadow-md"
    >
      <CardHeader>
        <CardTitle className="text-xl font-medium flex items-center gap-2">
          <Trash2 className="text-destructive size-5" aria-hidden />
          Data control
        </CardTitle>
        <CardDescription>
          Data is retained until you delete it here or stop using the service. Read
          the{" "}
          <Link
            href="/data-policy"
            className="text-foreground font-medium underline-offset-2 hover:underline"
          >
            data policy (draft)
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">
            Delete all organization data
          </p>
          {needsOrgField ? (
            <div className="mt-3 space-y-1">
              <label
                htmlFor="purge-org-id"
                className="text-muted-foreground text-xs font-medium"
              >
                Organization ID
              </label>
              <input
                id="purge-org-id"
                value={orgIdInput}
                onChange={(e) => setOrgIdInput(e.target.value)}
                placeholder="company_123"
                className="border-input bg-background w-full max-w-md rounded-md border px-3 py-2 text-sm"
              />
            </div>
          ) : null}
          <p className="text-muted-foreground mt-2 text-sm">
            Removes licence rows, vendors, uploads metadata, report email
            subscriptions, consent records, and org-scoped audit entries for your
            organization from our database, and deletes uploaded Excel files from
            blob storage. Irreversible.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <label
                htmlFor="purge-confirm"
                className="text-muted-foreground text-xs font-medium"
              >
                Type DELETE to confirm
              </label>
              <input
                id="purge-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                className="border-input bg-background font-mono w-full max-w-xs rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting || confirmText !== "DELETE"}
              onClick={() => void onDelete()}
            >
              {deleting ? "Deleting…" : "Delete organization data"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
