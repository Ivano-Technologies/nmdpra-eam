import { POWERED_BY_LINE } from "@/lib/brand";
import { cn } from "@/lib/utils";

type PoweredByTechivanoProps = {
  className?: string;
  /** Dark text on light surfaces (e.g. PDF margins) */
  variant?: "dark" | "light" | "muted";
};

const variantClass: Record<NonNullable<PoweredByTechivanoProps["variant"]>, string> = {
  dark: "text-zinc-900",
  light: "text-white",
  muted: "text-zinc-500"
};

/**
 * Small attribution line for reports, exports, and email footers.
 */
export function PoweredByTechivano({
  className,
  variant = "muted"
}: PoweredByTechivanoProps) {
  return (
    <p
      className={cn(
        "font-medium tracking-wide uppercase",
        "text-[10px] sm:text-xs",
        variantClass[variant],
        className
      )}
      role="note"
    >
      {POWERED_BY_LINE}
    </p>
  );
}
