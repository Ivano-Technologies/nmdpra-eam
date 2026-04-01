"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";

import type { UserPreferencesDoc } from "@/types/user-preferences";

type PrefsState = UserPreferencesDoc | null;

export function useUserPreferences() {
  const { isLoaded, userId } = useAuth();
  const [preferences, setPreferences] = useState<PrefsState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setPreferences(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/preferences", { cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as {
        preferences?: PrefsState;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? `Failed to load preferences (${res.status})`);
      }
      setPreferences(body.preferences ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setPreferences(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    void load();
  }, [isLoaded, load]);

  const patchPreferences = useCallback(
    async (patch: Partial<UserPreferencesDoc> & { orgId?: string }) => {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      const body = (await res.json().catch(() => ({}))) as {
        preferences?: PrefsState;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? "Failed to save preferences");
      }
      setPreferences(body.preferences ?? null);
    },
    []
  );

  const patchDebounced = useCallback(
    (patch: Partial<UserPreferencesDoc>, delayMs = 400) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        void patchPreferences(patch).catch(() => undefined);
      }, delayMs);
    },
    [patchPreferences]
  );

  return {
    preferences,
    loading,
    error,
    reload: load,
    patchPreferences,
    patchDebounced
  };
}
