"use client";

import { useEffect, useState } from "react";

import { getPublicApiBase } from "@/lib/api";

type HealthBody = {
  ok?: boolean;
  latencyMs?: number;
};

export function SystemStatus() {
  const [state, setState] = useState<"loading" | "live" | "down">("loading");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`${getPublicApiBase()}/health`, {
          cache: "no-store"
        });
        if (!res.ok) {
          if (!cancelled) setState("down");
          return;
        }
        const body = (await res.json()) as HealthBody;
        if (!cancelled) {
          setState(body.ok === true ? "live" : "down");
        }
      } catch {
        if (!cancelled) setState("down");
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <span className="text-muted-foreground border-border inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
        <span className="bg-muted-foreground size-1.5 animate-pulse rounded-full" />
        Checking…
      </span>
    );
  }

  if (state === "live") {
    return (
      <span className="border-border inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
        System live
      </span>
    );
  }

  return (
    <span className="border-destructive/30 bg-destructive/10 text-destructive inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
      <span className="bg-destructive size-1.5 rounded-full" aria-hidden />
      API unreachable
    </span>
  );
}
