import type { ImgHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/** Official raster mark (navy + gold tones) — dark theme UI, favicons, OG */
export const TECHIVANO_MARK_PNG = "/brand/techivano-mark.png";
/** Green + navy on white — light theme UI */
export const TECHIVANO_MARK_LIGHT_PNG = "/brand/techivano-mark-light.png";

export type TechivanoMarkAccent = "default" | "gold";

type TechivanoMarkProps = {
  className?: string;
  size?: number;
  /** Accessible name when the mark is meaningful on its own; omit when decorative */
  title?: string;
  decorative?: boolean;
  /**
   * `default` — source artwork
   * `gold` — same asset with a light gold glow for UI accent contexts (dark theme only)
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

const imgClass = "h-full w-full object-contain";

/**
 * Techivano logo mark — theme-aware PNGs: light (`techivano-mark-light.png`) vs dark (`techivano-mark.png`).
 * Favicons / `app/icon` still use the dark mark pipeline unless regenerated.
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
  const motionCls = motionClass[motion];

  return (
    <span
      className={cn("inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size brand assets */}
      <img
        src={TECHIVANO_MARK_LIGHT_PNG}
        width={size}
        height={size}
        className={cn(imgClass, motionCls, "dark:hidden")}
        alt={title ?? ""}
        aria-hidden={hidden || undefined}
        {...rest}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size brand assets */}
      <img
        src={TECHIVANO_MARK_PNG}
        width={size}
        height={size}
        className={cn(
          imgClass,
          motionCls,
          "hidden dark:block",
          accentGold && "drop-shadow-[0_0_10px_rgba(212,175,55,0.45)]"
        )}
        alt={title ?? ""}
        aria-hidden={hidden || undefined}
      />
    </span>
  );
}
