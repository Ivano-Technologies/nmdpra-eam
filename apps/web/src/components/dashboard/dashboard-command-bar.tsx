"use client";

import { Search } from "lucide-react";

import { useCommandPalette } from "@/components/dashboard/command-palette-context";

export function DashboardCommandBar() {
  const { setOpen } = useCommandPalette();

  return (
    <div className="mb-6 rounded-xl border border-white/5 bg-[#111827] p-3 shadow-lg shadow-black/20">
      <div className="flex items-center gap-3 px-1">
        <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:text-foreground w-full rounded-md bg-transparent py-1.5 text-left text-sm outline-none transition-colors"
        >
          Search or ask… (expiring, risk, report, weekly)
        </button>
        <kbd className="bg-muted text-muted-foreground hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
          ⌘K
        </kbd>
      </div>
    </div>
  );
}
