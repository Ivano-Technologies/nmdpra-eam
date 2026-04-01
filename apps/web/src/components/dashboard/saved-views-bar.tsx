"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import type { SavedView, SavedViewFilter } from "@/types/user-preferences";

const EXPIRY_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CRITICAL", label: "Critical (≤30d)" },
  { value: "WARNING", label: "Warning (31–60d)" },
  { value: "SAFE", label: "Safe (>60d)" }
] as const;

type Props = {
  savedViews: SavedView[] | undefined;
  filter: SavedViewFilter;
  onFilterChange: (next: SavedViewFilter) => void;
  activeViewId: string | null;
  onApplyView: (view: SavedView | null) => void;
  onSaveView: (name: string, filters: SavedViewFilter) => void;
};

export function SavedViewsBar({
  savedViews,
  filter,
  onFilterChange,
  activeViewId,
  onApplyView,
  onSaveView
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nameDraft, setNameDraft] = useState("");

  const setViewInUrl = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      if (id) {
        next.set("view", id);
      } else {
        next.delete("view");
      }
      const q = next.toString();
      router.replace(q ? `/dashboard?${q}` : "/dashboard", { scroll: false });
    },
    [router, searchParams]
  );

  const onSelect = (id: string) => {
    const v = savedViews?.find((s) => s.id === id);
    if (v) {
      onApplyView(v);
      setViewInUrl(id);
    }
  };

  const onClear = () => {
    onApplyView(null);
    setViewInUrl(null);
  };

  const save = () => {
    const name = nameDraft.trim() || "My view";
    onSaveView(name, { ...filter });
    setNameDraft("");
  };

  return (
    <div className="border-border bg-muted/20 flex flex-col gap-3 rounded-lg border px-3 py-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <label
            htmlFor="filter-expiry"
            className="text-muted-foreground text-xs font-medium"
          >
            Expiry band
          </label>
          <select
            id="filter-expiry"
            className="border-input bg-background w-full rounded-md border px-2 py-1.5 text-sm"
            value={filter.expiryStatus ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                expiryStatus: e.target.value || undefined
              })
            }
          >
            {EXPIRY_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="filter-vendor"
            className="text-muted-foreground text-xs font-medium"
          >
            Vendor contains
          </label>
          <input
            id="filter-vendor"
            type="search"
            placeholder="Search vendor name"
            value={filter.vendorQuery ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                vendorQuery: e.target.value || undefined
              })
            }
            className="border-input bg-background w-full rounded-md border px-2 py-1.5 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="saved-view-select"
            className="text-muted-foreground text-xs font-medium"
          >
            Saved views
          </label>
          <select
            id="saved-view-select"
            className="border-input bg-background w-full rounded-md border px-2 py-1.5 text-sm"
            value={activeViewId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                onClear();
              } else {
                onSelect(v);
              }
            }}
          >
            <option value="">Current filters (unsaved)</option>
            {(savedViews ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Name for new view"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          className="border-input bg-background max-w-[12rem] rounded-md border px-2 py-1.5 text-sm"
        />
        <Button type="button" size="sm" variant="secondary" onClick={save}>
          Save current view
        </Button>
        {activeViewId ? (
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            Clear view
          </Button>
        ) : null}
      </div>
    </div>
  );
}
