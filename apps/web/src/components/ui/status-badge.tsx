import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatusBadgeVariant = "active" | "expired" | "warning";

const VARIANTS: Record<
  StatusBadgeVariant,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
  },
  expired: {
    label: "Expired",
    className:
      "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100"
  },
  warning: {
    label: "Warning",
    className:
      "border-amber-500/50 bg-amber-500/10 text-amber-950 dark:text-amber-100"
  }
};

export function StatusBadge({
  variant,
  children,
  className
}: {
  variant: StatusBadgeVariant;
  children?: ReactNode;
  className?: string;
}) {
  const v = VARIANTS[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        v.className,
        className
      )}
    >
      {children ?? v.label}
    </span>
  );
}
