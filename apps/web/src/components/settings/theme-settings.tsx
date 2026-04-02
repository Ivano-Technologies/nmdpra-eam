"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const options = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "system" as const, label: "System", icon: Monitor }
];

function subscribeToNothing() {
  return () => {};
}

export function ThemeSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeToNothing, () => true, () => false);

  return (
    <section
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
      aria-labelledby="appearance-heading"
    >
      <h2 id="appearance-heading" className="text-lg font-semibold tracking-tight">
        Appearance
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Choose a light or dark interface. System follows your device setting.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map(({ value, label, icon: Icon }) => {
          const active = mounted && theme === value;
          return (
            <Button
              key={value}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              className={cn("gap-2", active && "pointer-events-none")}
              onClick={() => setTheme(value)}
              aria-pressed={active}
              disabled={!mounted}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </Button>
          );
        })}
      </div>
      {mounted && theme === "system" ? (
        <p className="text-muted-foreground mt-3 text-xs">
          Using {resolvedTheme === "dark" ? "dark" : "light"} mode from your system.
        </p>
      ) : null}
    </section>
  );
}
