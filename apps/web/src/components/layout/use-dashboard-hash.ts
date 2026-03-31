"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Tracks `window.location.hash` for in-dashboard navigation (sidebar active states).
 */
export function useDashboardHash(): string {
  const [hash, setHash] = useState("");

  const read = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    setHash(window.location.hash);
  }, []);

  useEffect(() => {
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [read]);

  return hash;
}
