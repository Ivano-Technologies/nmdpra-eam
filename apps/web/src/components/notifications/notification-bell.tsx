"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import useSWR from "swr";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationRow = {
  _id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
  kind?: string;
};

async function fetchNotifications(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to load notifications");
  }
  return res.json() as Promise<{
    notifications: NotificationRow[];
    unreadCount: number;
  }>;
}

export function NotificationBell() {
  const { data, mutate, error } = useSWR("/api/user/notifications", fetchNotifications, {
    refreshInterval: 60_000,
    revalidateOnFocus: true
  });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", onDoc);
    }
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const unread = data?.unreadCount ?? 0;
  const items = data?.notifications ?? [];

  const markAllRead = useCallback(async () => {
    await fetch("/api/user/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true })
    });
    void mutate();
  }, [mutate]);

  const markOne = useCallback(
    async (id: string) => {
      await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
      });
      void mutate();
    },
    [mutate]
  );

  if (error) {
    return null;
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="relative text-muted-foreground hover:text-foreground"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-black tabular-nums">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </Button>
      {open ? (
        <div
          className="border-border bg-[#111827] text-foreground absolute right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] max-h-[min(70vh,26rem)] overflow-hidden rounded-xl border border-white/10 shadow-xl shadow-black/40"
          role="dialog"
          aria-label="Notifications list"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="text-sm font-medium">Notifications</span>
            {unread > 0 ? (
              <button
                type="button"
                className="text-brand-gold text-xs font-medium hover:underline"
                onClick={() => void markAllRead()}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="max-h-64 overflow-y-auto p-1">
            {items.length === 0 ? (
              <li className="text-muted-foreground px-3 py-8 text-center text-sm">
                No notifications yet
              </li>
            ) : (
              items.map((n) => (
                <li key={n._id}>
                  <button
                    type="button"
                    className={cn(
                      "hover:bg-white/5 w-full rounded-lg px-2 py-2 text-left text-sm transition-colors",
                      !n.read && "bg-white/[0.04]"
                    )}
                    onClick={() => {
                      if (!n.read) {
                        void markOne(n._id);
                      }
                    }}
                  >
                    <div className="text-foreground font-medium">{n.title}</div>
                    <div className="text-muted-foreground line-clamp-2 text-xs">{n.body}</div>
                    <div className="text-muted-foreground mt-1 text-[10px] opacity-80">
                      {new Date(n.createdAt).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short"
                      })}
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-white/10 px-2 py-2">
            <Link
              href="/dashboard#section-weekly-insight"
              className="text-brand-gold block text-center text-xs font-medium hover:underline"
              onClick={() => setOpen(false)}
            >
              Review now →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
