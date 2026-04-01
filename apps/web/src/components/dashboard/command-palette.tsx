"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Command } from "cmdk";

import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/roles";

type Props = {
  role: Role;
};

export function CommandPalette({ role }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const go = useCallback((hash: string) => {
    setOpen(false);
    router.push(`/dashboard${hash}`);
  }, [router]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    globalThis.window?.addEventListener("keydown", down);
    return () => globalThis.window?.removeEventListener("keydown", down);
  }, []);

  if (role === "client") {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-muted-foreground hidden md:inline-flex"
        onClick={() => setOpen(true)}
      >
        Search…
        <kbd className="bg-muted ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[15vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <Command className="bg-popover text-popover-foreground border-border w-full max-w-lg overflow-hidden rounded-xl border shadow-lg">
            <Command.Input
              placeholder="Go to…"
              className="border-input w-full border-b px-4 py-3 text-sm outline-none"
            />
            <Command.List className="max-h-72 overflow-y-auto p-2">
              <Command.Empty className="text-muted-foreground py-6 text-center text-sm">
                No results.
              </Command.Empty>
              <Command.Group heading="Dashboard" className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                <Command.Item
                  className="aria-selected:bg-accent cursor-pointer rounded-md px-2 py-2 text-sm"
                  onSelect={() => go("#section-overview")}
                >
                  Overview
                </Command.Item>
                <Command.Item
                  className="aria-selected:bg-accent cursor-pointer rounded-md px-2 py-2 text-sm"
                  onSelect={() => go("#section-data-upload")}
                >
                  Data upload
                </Command.Item>
                <Command.Item
                  className="aria-selected:bg-accent cursor-pointer rounded-md px-2 py-2 text-sm"
                  onSelect={() => go("#section-expiry-radar")}
                >
                  Expiry radar
                </Command.Item>
                <Command.Item
                  className="aria-selected:bg-accent cursor-pointer rounded-md px-2 py-2 text-sm"
                  onSelect={() => go("#section-risk-ranking")}
                >
                  Risk ranking
                </Command.Item>
                <Command.Item
                  className="aria-selected:bg-accent cursor-pointer rounded-md px-2 py-2 text-sm"
                  onSelect={() => go("#section-reports")}
                >
                  Reports
                </Command.Item>
              </Command.Group>
              {role === "owner" ? (
                <Command.Group heading="Owner" className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                  <Command.Item
                    className="aria-selected:bg-accent cursor-pointer rounded-md px-2 py-2 text-sm"
                    onSelect={() => go("#section-owner-panel")}
                  >
                    Owner workspace
                  </Command.Item>
                  <Command.Item
                    className="aria-selected:bg-accent cursor-pointer rounded-md px-2 py-2 text-sm"
                    onSelect={() => go("#section-owner-users")}
                  >
                    User roles
                  </Command.Item>
                  <Command.Item
                    className="aria-selected:bg-accent cursor-pointer rounded-md px-2 py-2 text-sm"
                    onSelect={() => go("#section-data-control")}
                  >
                    Data control
                  </Command.Item>
                </Command.Group>
              ) : null}
              <Command.Group heading="Pages" className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                <Command.Item
                  className="aria-selected:bg-accent cursor-pointer rounded-md px-2 py-2 text-sm"
                  onSelect={() => {
                    setOpen(false);
                    router.push("/data-policy");
                  }}
                >
                  Data policy
                </Command.Item>
                <Command.Item
                  className="aria-selected:bg-accent cursor-pointer rounded-md px-2 py-2 text-sm"
                  onSelect={() => {
                    setOpen(false);
                    router.push("/");
                  }}
                >
                  Home
                </Command.Item>
              </Command.Group>
            </Command.List>
            <button
              type="button"
              className="text-muted-foreground hover:bg-muted w-full border-t px-4 py-2 text-left text-xs"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </Command>
        </div>
      ) : null}
    </>
  );
}
