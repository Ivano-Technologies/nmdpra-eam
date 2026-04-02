"use client";

import { useCallback, useEffect, useState } from "react";

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
      const res = await fetch("/api/user/consent?scope=terms", {
        cache: "no-store"
      });
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
      const res = await fetch("/api/user/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "terms" })
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "Could not save consent");
      }
      await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingSteps: { termsAccepted: true }
        })
      }).catch(() => undefined);
      setAccepted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save consent");
    } finally {
      setSubmitting(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex min-h-[40vh] flex-col items-center justify-center gap-4 bg-black/60 px-4">
        <div className="h-24 w-full max-w-md animate-pulse rounded-lg bg-white/5 shadow-lg shadow-black/20" />
        <p className="text-sm text-text-secondary">Loading…</p>
      </div>
    );
  }

  if (!accepted) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-gate-title"
        aria-describedby="terms-gate-desc"
      >
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-bg-primary p-8 text-text-primary shadow-lg shadow-black/30">
          <h2
            id="terms-gate-title"
            className="font-heading mb-4 text-2xl text-brand-gold drop-shadow-[0_0_6px_rgba(222,175,95,0.35)]"
          >
            Data Usage &amp; Compliance
          </h2>
          <p
            id="terms-gate-desc"
            className="text-sm leading-relaxed text-gray-300"
          >
            By continuing, you acknowledge that compliance and licence data you or
            your organization submit may be stored and processed in this
            application for regulatory monitoring purposes. Organization owners may
            delete organization data from the Owner workspace. This notice is not
            legal advice; review your{" "}
            <a
              href="/data-policy"
              className="text-brand-gold underline-offset-2 hover:underline"
            >
              data policy (draft)
            </a>
            .
          </p>
          {error ? (
            <p className="mt-3 text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            className="mt-6 rounded-lg bg-brand-gold px-5 py-2 font-semibold text-black transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#deaf5f]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-60"
            onClick={() => void onAccept()}
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Accept and continue"}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
