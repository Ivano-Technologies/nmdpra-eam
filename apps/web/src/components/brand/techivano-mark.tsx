import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

const MARK_SRC_DEFAULT = "/brand/techivano-mark.svg";

const ACCENT = {
  default: { primary: "#22c55e", node: "#22c55e" },
  gold: { primary: "#D4AF37", node: "#D4AF37" }
} as const;

export type TechivanoMarkAccent = keyof typeof ACCENT;

type TechivanoMarkProps = {
  className?: string;
  size?: number;
  /** Accessible name when the mark is meaningful on its own; omit when decorative */
  title?: string;
  decorative?: boolean;
  /**
   * `default` — navy + emerald (brand)
   * `gold` — navy + gold (matches UI primary accent)
   * `img` — raster from `/brand/techivano-mark.svg` (emerald only)
   */
  variant?: TechivanoMarkAccent | "img";
  /** Subtle motion on hover (pair with interactive parents) */
  motion?: "none" | "hover-tilt" | "spin-slow";
} & Omit<SVGProps<SVGSVGElement>, "width" | "height">;

const motionClass: Record<NonNullable<TechivanoMarkProps["motion"]>, string> = {
  none: "",
  "hover-tilt": "transition-transform duration-300 ease-out group-hover/logo:rotate-3",
  "spin-slow": "animate-[spin_24s_linear_infinite] motion-reduce:animate-none"
};

/**
 * Techivano hex-cube mark — favicon uses `app/icon.svg`; raster via `variant="img"`.
 */
export function TechivanoMark({
  className,
  size = 32,
  title,
  decorative,
  variant = "default",
  motion = "none",
  ...rest
}: TechivanoMarkProps) {
  const hidden = decorative || !title;

  if (variant === "img") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- optional raster fallback
      <img
        src={MARK_SRC_DEFAULT}
        width={size}
        height={size}
        className={cn("shrink-0", motionClass[motion], className)}
        alt={title ?? ""}
        aria-hidden={hidden || undefined}
      />
    );
  }

  const colors = ACCENT[variant];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("shrink-0", motionClass[motion], className)}
      role={hidden ? "presentation" : "img"}
      aria-hidden={hidden || undefined}
      aria-label={hidden ? undefined : title}
      {...rest}
    >
      {!hidden && title ? <title>{title}</title> : null}
      <rect width="32" height="32" rx="6" fill="#0a192f" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M16 7l8.5 4.5v5.2L16 21.2 7.5 16.7V11.5L16 7z"
          stroke={colors.primary}
          strokeWidth="1.75"
        />
        <path d="M7.5 11.5L16 16v9l-8.5-4.5v-9z" stroke="#ffffff" strokeWidth="1.75" />
        <path d="M24.5 11.5L16 16v9l8.5-4.5v-9z" stroke="#ffffff" strokeWidth="1.75" />
        <circle cx="16" cy="16" r="2.25" fill={colors.node} />
        <circle cx="16" cy="9.2" r="1.15" fill={colors.node} />
        <circle cx="10.2" cy="19.2" r="1.15" fill="#ffffff" />
        <circle cx="21.8" cy="19.2" r="1.15" fill="#ffffff" />
      </g>
    </svg>
  );
}
