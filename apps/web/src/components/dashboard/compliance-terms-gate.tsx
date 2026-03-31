"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
};

/**
 * Blocks the dashboard until the user accepts the current terms version (server-stored consent).
 */
export function ComplianceTermsGate({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/consent?scope=terms", { cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as {
        accepted?: boolean;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? `Failed to load consent (${res.status})`);
      }
      setAccepted(Boolean(body.accepted));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load consent status");
      setAccepted(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onAccept = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "terms" })
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "Could not save consent");
      }
      setAccepted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save consent");
    } finally {
      setSubmitting(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center text-sm">
        Loading…
      </div>
    );
  }

  if (!accepted) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-gate-title"
        aria-describedby="terms-gate-desc"
      >
        <div className="bg-background border-border max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border p-6 shadow-lg">
          <h2 id="terms-gate-title" className="text-lg font-semibold">
            Data usage
          </h2>
          <p id="terms-gate-desc" className="text-muted-foreground mt-3 text-sm leading-relaxed">
            By continuing, you acknowledge that compliance and licence data you or
            your organization submit may be stored and processed in this
            application for regulatory monitoring purposes. Organization owners may
            delete organization data from the Owner workspace. This notice is not
            legal advice; review your{" "}
            <a href="/data-policy" className="text-primary underline-offset-2 hover:underline">
              data policy (draft)
            </a>
            .
          </p>
          {error ? (
            <p className="text-destructive mt-3 text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => void onAccept()}
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Accept and continue"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
