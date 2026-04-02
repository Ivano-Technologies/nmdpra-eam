"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Command } from "cmdk";

import { useCommandPalette } from "@/components/dashboard/command-palette-context";
import type { Role } from "@/lib/roles";

type Props = {
  role: Role;
};

function scrollToDashboardSection(hash: string) {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

export function CommandPalette({ role }: Props) {
  const { open, setOpen, toggle } = useCommandPalette();
  const router = useRouter();
  const pathname = usePathname();

  const go = useCallback(
    (hash: string) => {
      setOpen(false);
      const target = `/dashboard${hash}`;
      const onDashboard =
        pathname === "/dashboard" || (pathname?.startsWith("/dashboard/") ?? false);
      if (onDashboard) {
        router.replace(target, { scroll: false });
        scrollToDashboardSection(hash);
      } else {
        router.push(target);
      }
    },
    [pathname, router, setOpen]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };
    globalThis.window?.addEventListener("keydown", down);
    return () => globalThis.window?.removeEventListener("keydown", down);
  }, [toggle]);

  if (role === "client") {
    return null;
  }

  const itemClass =
    "cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-300 outline-none transition-colors duration-150 hover:bg-white/5 aria-selected:bg-[#22c55e]/10 aria-selected:text-white";

  return (
    <>
      <button
        type="button"
        className="hidden md:flex items-center gap-3 rounded-xl border border-white/10 bg-[#111827]/80 px-4 py-2 text-sm text-gray-300 shadow-lg shadow-black/30 backdrop-blur-md transition-all duration-200 hover:scale-[1.01] hover:border-white/20 focus-visible:border-[#22c55e]/50 focus-visible:outline-none"
        onClick={() => setOpen(true)}
      >
        <span className="text-xs text-gray-500">⌘K</span>
        <span>Search</span>
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[15vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <Command className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]/95 text-slate-100 shadow-xl shadow-black/40 backdrop-blur-xl">
            <div className="m-3 flex items-center gap-3 rounded-xl border border-white/10 bg-[#111827]/80 px-4 py-2 text-sm text-gray-300 shadow-lg shadow-black/30 backdrop-blur-md transition-colors duration-200 hover:border-white/20 focus-within:border-[#22c55e]/50">
              <span className="text-xs text-gray-500">⌘K</span>
              <Command.Input
                placeholder="Search"
                className="w-full bg-transparent text-sm text-gray-300 placeholder:text-gray-500 outline-none"
              />
            </div>
            <Command.List className="max-h-72 overflow-y-auto px-3 pb-3">
              <Command.Empty className="py-6 text-center text-sm text-gray-500">
                No results.
              </Command.Empty>
              <Command.Group
                heading="Quick actions"
                className="px-2 py-1.5 text-xs font-medium text-gray-500"
              >
                <Command.Item
                  className={itemClass}
                  keywords={[
                    "show",
                    "expiring",
                    "licences",
                    "licenses",
                    "30",
                    "days",
                    "radar"
                  ]}
                  onSelect={() => go("#section-expiry-radar")}
                >
                  Show expiring licences
                </Command.Item>
                <Command.Item
                  className={itemClass}
                  keywords={["open", "risk", "overview", "kpi", "attention"]}
                  onSelect={() => go("#section-overview")}
                >
                  Open risk overview
                </Command.Item>
                <Command.Item
                  className={itemClass}
                  keywords={["generate", "report", "pdf", "export", "download", "email"]}
                  onSelect={() => go("#section-reports")}
                >
                  Generate report
                </Command.Item>
                <Command.Item
                  className={itemClass}
                  keywords={["weekly", "insight", "digest", "summary"]}
                  onSelect={() => go("#section-weekly-insight")}
                >
                  View weekly insight
                </Command.Item>
              </Command.Group>
              <Command.Group heading="Dashboard" className="px-2 py-1.5 text-xs font-medium text-gray-500">
                <Command.Item
                  className={itemClass}
                  onSelect={() => go("#section-overview")}
                >
                  Overview
                </Command.Item>
                <Command.Item
                  className={itemClass}
                  onSelect={() => go("#section-data-upload")}
                >
                  Data upload
                </Command.Item>
                <Command.Item
                  className={itemClass}
                  onSelect={() => go("#section-expiry-radar")}
                >
                  Expiry radar
                </Command.Item>
                <Command.Item
                  className={itemClass}
                  onSelect={() => go("#section-risk-ranking")}
                >
                  Risk ranking
                </Command.Item>
                <Command.Item
                  className={itemClass}
                  onSelect={() => go("#section-reports")}
                >
                  Reports
                </Command.Item>
                <Command.Item
                  className={itemClass}
                  onSelect={() => go("#section-weekly-insight")}
                >
                  Weekly insight
                </Command.Item>
              </Command.Group>
              {role === "owner" ? (
                <Command.Group heading="Owner" className="px-2 py-1.5 text-xs font-medium text-gray-500">
                  <Command.Item
                    className={itemClass}
                    onSelect={() => go("#section-owner-panel")}
                  >
                    Owner workspace
                  </Command.Item>
                  <Command.Item
                    className={itemClass}
                    onSelect={() => go("#section-owner-users")}
                  >
                    User roles
                  </Command.Item>
                  <Command.Item
                    className={itemClass}
                    onSelect={() => go("#section-data-control")}
                  >
                    Data control
                  </Command.Item>
                </Command.Group>
              ) : null}
              <Command.Group heading="Pages" className="px-2 py-1.5 text-xs font-medium text-gray-500">
                <Command.Item
                  className={itemClass}
                  onSelect={() => {
                    setOpen(false);
                    router.push("/data-policy");
                  }}
                >
                  Data policy
                </Command.Item>
                <Command.Item
                  className={itemClass}
                  onSelect={() => {
                    setOpen(false);
                    router.push("/");
                  }}
                >
                  Home
                </Command.Item>
              </Command.Group>
            </Command.List>
            <p className="border-t border-white/10 px-4 py-2 text-xs text-gray-500">
              Try: expiring, risk, reports
            </p>
            <button
              type="button"
              className="w-full border-t border-white/10 px-4 py-2 text-left text-xs text-gray-400 transition hover:bg-white/5"
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
