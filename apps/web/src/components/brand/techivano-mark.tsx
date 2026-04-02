import type { ImgHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/** Official raster mark (navy + green + white) — also used for favicons */
export const TECHIVANO_MARK_PNG = "/brand/techivano-mark.png";

export type TechivanoMarkAccent = "default" | "gold";

type TechivanoMarkProps = {
  className?: string;
  size?: number;
  /** Accessible name when the mark is meaningful on its own; omit when decorative */
  title?: string;
  decorative?: boolean;
  /**
   * `default` — source artwork
   * `gold` — same asset with a light gold glow for UI accent contexts
   * `img` — alias of default (kept for API compatibility)
   */
  variant?: TechivanoMarkAccent | "img";
  /** Subtle motion on hover (pair with interactive parents) */
  motion?: "none" | "hover-tilt" | "spin-slow";
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "width" | "height" | "src" | "alt">;

const motionClass: Record<NonNullable<TechivanoMarkProps["motion"]>, string> = {
  none: "",
  "hover-tilt": "transition-transform duration-300 ease-out group-hover/logo:rotate-3",
  "spin-slow": "animate-[spin_24s_linear_infinite] motion-reduce:animate-none"
};

/**
 * Techivano logo mark — PNG asset shared with favicons (`/brand/techivano-mark.png`, `app/icon.png`).
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
  const accentGold = variant === "gold";

  return (
    // eslint-disable-next-line @next/next/no-img-element -- small fixed-size brand asset; avoids layout shift
    <img
      src={TECHIVANO_MARK_PNG}
      width={size}
      height={size}
      className={cn(
        "shrink-0 object-contain",
        motionClass[motion],
        accentGold && "drop-shadow-[0_0_10px_rgba(212,175,55,0.45)]",
        className
      )}
      alt={title ?? ""}
      aria-hidden={hidden || undefined}
      {...rest}
    />
  );
}
