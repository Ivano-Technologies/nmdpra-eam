"use client";

import Link from "next/link";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BRAND_FOOTER,
  BRAND_NAME,
  BRAND_TAGLINE,
  BRAND_IQ_ACCENT_CLASS,
  PRODUCT_NAME
} from "@/lib/brand";
import { cn } from "@/lib/utils";

import { TechivanoMark, type TechivanoMarkAccent } from "./techivano-mark";

type IvanoIQLogoProps = {
  className?: string;
  markClassName?: string;
  size?: "sm" | "md";
  showTagline?: boolean;
  href?: string;
  onClick?: () => void;
  taglineClassName?: string;
  markVariant?: TechivanoMarkAccent;
  compact?: boolean | "responsive" | "mark-tooltip";
  /** @deprecated Both map to Ivano IQ wordmark */
  wordmark?: "company" | "product";
  motion?: "none" | "hover-tilt" | "spin-slow";
};

const sizes = {
  sm: { mark: 28, name: "text-sm", tagline: "text-[10px] leading-tight" },
  md: { mark: 36, name: "text-base", tagline: "text-[11px] leading-tight md:text-xs" }
};

function WordmarkTitle({
  className,
  size
}: {
  className?: string;
  size: keyof typeof sizes;
}) {
  const s = sizes[size];
  return (
    <span
      className={cn(
        "font-heading font-semibold tracking-tight text-foreground",
        s.name,
        className
      )}
    >
      Ivano <span className={BRAND_IQ_ACCENT_CLASS}>IQ</span>
    </span>
  );
}

function Mark({
  s,
  markClassName,
  markVariant,
  motion
}: {
  s: (typeof sizes)["sm"];
  markClassName?: string;
  markVariant: TechivanoMarkAccent;
  motion: "none" | "hover-tilt" | "spin-slow";
}) {
  const markMotion =
    motion === "hover-tilt" ? "hover-tilt" : motion === "spin-slow" ? "spin-slow" : "none";
  return (
    <TechivanoMark
      size={s.mark}
      className={markClassName}
      decorative
      variant={markVariant}
      motion={markMotion}
    />
  );
}

/**
 * Horizontal Ivano IQ branding: mark + wordmark with gold **IQ** (+ optional tagline).
 */
export function IvanoIQLogo({
  className,
  markClassName,
  size = "md",
  showTagline = false,
  href,
  onClick,
  taglineClassName,
  markVariant = "default",
  compact = false,
  motion = "hover-tilt"
}: IvanoIQLogoProps) {
  const s = sizes[size];
  const markMotion: "none" | "hover-tilt" | "spin-slow" = motion === "none" ? "none" : motion;

  const body = (() => {
    if (compact === "mark-tooltip") {
      return (
        <span className={cn("inline-flex items-center", className)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-default">
                <Mark
                  s={s}
                  markClassName={markClassName}
                  markVariant={markVariant}
                  motion={markMotion}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="font-medium">
                Ivano <span className={BRAND_IQ_ACCENT_CLASS}>IQ</span>
              </p>
              <p className="text-muted-foreground max-w-[240px] text-[11px]">{BRAND_TAGLINE}</p>
              <p className="text-muted-foreground mt-1 text-[10px]">{BRAND_FOOTER}</p>
            </TooltipContent>
          </Tooltip>
        </span>
      );
    }

    if (compact === true) {
      return (
        <span className={cn("flex items-center gap-2", className)}>
          <Mark
            s={s}
            markClassName={markClassName}
            markVariant={markVariant}
            motion={markMotion}
          />
          <WordmarkTitle size={size} />
        </span>
      );
    }

    if (compact === "responsive") {
      return (
        <span className={cn("flex items-center gap-2.5", className)}>
          <Mark
            s={s}
            markClassName={markClassName}
            markVariant={markVariant}
            motion={markMotion}
          />
          <span className="flex min-w-0 flex-col text-left leading-tight">
            <span className="md:hidden">
              <WordmarkTitle size="sm" />
            </span>
            <span className="hidden md:inline">
              <WordmarkTitle size={size} />
            </span>
            {showTagline ? (
              <span
                className={cn(
                  "text-muted-foreground hidden max-w-[14rem] truncate md:block sm:max-w-none sm:whitespace-normal",
                  s.tagline,
                  taglineClassName
                )}
              >
                {BRAND_TAGLINE}
              </span>
            ) : null}
          </span>
        </span>
      );
    }

    return (
      <span className={cn("flex items-center gap-2.5", className)}>
        <Mark
          s={s}
          markClassName={markClassName}
          markVariant={markVariant}
          motion={markMotion}
        />
        <span className="flex min-w-0 flex-col text-left leading-tight">
          <WordmarkTitle size={size} />
          {showTagline ? (
            <span
              className={cn(
                "text-muted-foreground max-w-[14rem] truncate sm:max-w-none sm:whitespace-normal",
                s.tagline,
                taglineClassName
              )}
            >
              {BRAND_TAGLINE}
            </span>
          ) : null}
        </span>
      </span>
    );
  })();

  const wrapped = <span className="min-w-0 shrink-0">{body}</span>;

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-label={
          href.startsWith("/dashboard") ? `${PRODUCT_NAME} dashboard` : `${BRAND_NAME} home`
        }
        className="group/logo min-w-0 shrink-0 rounded-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        {wrapped}
      </Link>
    );
  }

  return wrapped;
}

/** Inline wordmark for dashboard header (no mark). */
export function IvanoIQWordmarkInline({ className }: { className?: string }) {
  return (
    <span className={cn("font-heading font-semibold tracking-tight text-foreground", className)}>
      Ivano <span className={BRAND_IQ_ACCENT_CLASS}>IQ</span>
    </span>
  );
}
