"use client";

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

export function DangerZone() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [understand, setUnderstand] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setModalOpen(false);
    setConfirmText("");
    setUnderstand(false);
    setStep(1);
  }, []);

  const requestDeletion = useCallback(async () => {
    if (confirmText !== "DELETE" || !understand) {
      toast.error('Type DELETE and confirm you understand the consequences.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/delete-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" })
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setStep(2);
      toast.success("Deletion scheduled. Confirm the final step below.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [confirmText, understand]);

  const executeDeletion = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/data", { method: "DELETE" });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        status?: string;
        warnings?: string[];
      };
      if (!res.ok) {
        throw new Error(body.error ?? `Deletion failed (${res.status})`);
      }
      toast.success("Your Convex data has been erased.");
      if (body.warnings?.length) {
        console.info("Deletion warnings", body.warnings);
      }
      reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deletion failed");
    } finally {
      setLoading(false);
    }
  }, [reset]);

  const requestExport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/export", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        exportId?: string;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? "Export failed");
      }
      toast.success(body.message ?? "Export job created (placeholder).");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <>
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for your account data stored in this app (Convex).
            Your Clerk login is not removed here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => void requestExport()}
            disabled={loading}
          >
            Export my data (scaffold)
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setModalOpen(true)}
            disabled={loading}
          >
            Delete my data
          </Button>
        </CardContent>
      </Card>

      {modalOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[90] bg-black/50"
            aria-label="Close"
            onClick={() => !loading && reset()}
          />
          <div
            className="border-border bg-background fixed top-1/2 left-1/2 z-[95] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="danger-zone-title"
          >
            <h2 id="danger-zone-title" className="text-lg font-semibold">
              {step === 1 ? "Confirm data deletion" : "Final confirmation"}
            </h2>
            {step === 1 ? (
              <>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  This will permanently delete your preferences, consent records
                  linked to your user, uploads metadata, and email subscriptions
                  matched to your account. Org-wide licence data may remain. This
                  action cannot be undone.
                </p>
                <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="border-input mt-1 size-4 rounded"
                    checked={understand}
                    onChange={(e) => setUnderstand(e.target.checked)}
                  />
                  <span>I understand this action is irreversible.</span>
                </label>
                <div className="mt-3">
                  <label
                    htmlFor="danger-confirm"
                    className="text-sm font-medium"
                  >
                    Type DELETE to confirm
                  </label>
                  <input
                    id="danger-confirm"
                    className="border-input bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    autoComplete="off"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => reset()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={loading}
                    onClick={() => void requestDeletion()}
                  >
                    {loading ? "Working…" : "Continue"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mt-3 text-sm">
                  Deletion is scheduled. Click below to permanently erase your data
                  from our database.
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => reset()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={loading}
                    onClick={() => void executeDeletion()}
                  >
                    {loading ? "Deleting…" : "Delete my data permanently"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </>
      ) : null}
    </>
  );
}
