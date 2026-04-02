"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import {
  FileText,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeft,
  Upload,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";

import { IvanoIQWordmarkInline } from "@/components/brand/ivano-iq-logo";
import { TechivanoLogo } from "@/components/brand/techivano-logo";
import { TechivanoMark } from "@/components/brand/techivano-mark";
import { CommandPaletteProvider } from "@/components/dashboard/command-palette-context";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { SystemStatus } from "@/components/dashboard/system-status";
import { Button } from "@/components/ui/button";
import { useDashboardHash } from "@/components/layout/use-dashboard-hash";
import { PRODUCT_NAME } from "@/lib/brand";
import { parseUserRole, type Role } from "@/lib/roles";
import { cn } from "@/lib/utils";

const navClass = cn(
  "flex w-full items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
  "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
);

const navActiveClass = cn(
  "bg-accent font-medium text-accent-foreground shadow-sm"
);

type NavItem = {
  href: string;
  hash: string;
  label: string;
  ownerOnly?: boolean;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", hash: "#section-overview", label: "Dashboard" },
  {
    href: "/dashboard",
    hash: "#section-data-upload",
    label: "Data upload",
    adminOnly: true
  },
  { href: "/dashboard", hash: "#section-reports", label: "Reports" },
  {
    href: "/dashboard",
    hash: "#section-owner-users",
    label: "User roles",
    ownerOnly: true
  }
];

const NAV_ICON: Record<string, ReactNode> = {
  "#section-overview": <LayoutDashboard className="size-4 shrink-0" aria-hidden />,
  "#section-data-upload": <Upload className="size-4 shrink-0" aria-hidden />,
  "#section-reports": <FileText className="size-4 shrink-0" aria-hidden />,
  "#section-owner-users": <Users className="size-4 shrink-0" aria-hidden />
};

function SidebarNav({
  role,
  collapsed,
  onNavigate
}: {
  role: Role;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const hash = useDashboardHash();

  const linkClass = (item: NavItem, defaultHash: string) => {
    const onDashboard =
      pathname === "/dashboard" ||
      (pathname?.startsWith("/dashboard/") ?? false);
    const active =
      onDashboard &&
      (hash === item.hash ||
        (!hash && item.hash === defaultHash));
    return cn(
      navClass,
      active && navActiveClass,
      collapsed && "justify-center px-2"
    );
  };

  if (role === "client") {
    const item: NavItem = {
      href: "/dashboard",
      hash: "#section-client",
      label: "Dashboard"
    };
    return (
      <nav className="flex flex-col gap-1 p-3" aria-label="Dashboard">
        <Link
          href={`${item.href}${item.hash}`}
          className={linkClass(item, "#section-client")}
          onClick={() => onNavigate?.()}
          title={item.label}
        >
          <LayoutDashboard className="size-4 shrink-0" aria-hidden />
          {!collapsed ? (
            <span className="truncate">{item.label}</span>
          ) : (
            <span className="sr-only">{item.label}</span>
          )}
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Dashboard">
      {NAV_ITEMS.filter(
        (item) =>
          (!item.ownerOnly || role === "owner") &&
          (!item.adminOnly || role === "admin" || role === "owner")
      ).map(
        (item) => (
          <Link
            key={item.hash}
            href={`${item.href}${item.hash}`}
            className={linkClass(item, "#section-overview")}
            onClick={() => onNavigate?.()}
            title={item.label}
          >
            {NAV_ICON[item.hash] ?? null}
            {!collapsed ? (
              <span className="truncate">{item.label}</span>
            ) : (
              <span className="sr-only">{item.label}</span>
            )}
          </Link>
        )
      )}
    </nav>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const role: Role = parseUserRole(user?.publicMetadata);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const sidebarWidth = desktopCollapsed ? "md:w-[4.5rem]" : "md:w-56";
  const mainOffset = desktopCollapsed ? "md:pl-[4.5rem]" : "md:pl-56";

  return (
    <CommandPaletteProvider>
    <div className="flex min-h-screen flex-col md:flex-row">
      {mobileOpen ? (
        <button
          type="button"
          className="bg-foreground/25 fixed inset-0 z-40 backdrop-blur-[2px] md:hidden"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        className={cn(
          "border-sidebar-border bg-sidebar/90 z-50 flex-col border-r shadow-lg shadow-black/10 backdrop-blur-xl transition-[width] duration-200 dark:shadow-black/25",
          "md:fixed md:inset-y-0 md:left-0 md:z-30",
          sidebarWidth,
          mobileOpen
            ? "fixed inset-x-0 top-14 bottom-0 z-50 flex max-h-[calc(100vh-3.5rem)] overflow-y-auto"
            : "hidden md:flex"
        )}
      >
        <div className="border-sidebar-border flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3 md:h-16">
          {!desktopCollapsed ? (
            <TechivanoLogo
              href="/dashboard"
              size="sm"
              wordmark="product"
              motion="none"
              className="min-w-0 truncate"
              onClick={closeMobile}
            />
          ) : (
            <Link
              href="/dashboard"
              title={PRODUCT_NAME}
              aria-label={`${PRODUCT_NAME} dashboard`}
              className="shrink-0 rounded-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/60"
              onClick={closeMobile}
            >
              <TechivanoMark size={28} decorative />
            </Link>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="hidden md:inline-flex"
            aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setDesktopCollapsed((c) => !c)}
          >
            {desktopCollapsed ? (
              <PanelLeft className="size-4" aria-hidden />
            ) : (
              <PanelLeftClose className="size-4" aria-hidden />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={closeMobile}
          >
            Close
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav
            role={role}
            collapsed={desktopCollapsed}
            onNavigate={closeMobile}
          />
        </div>
      </aside>

      <div
        className={cn("flex min-w-0 flex-1 flex-col", mainOffset)}
      >
        <div className="border-sidebar-border flex h-14 items-center gap-2 border-b px-4 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" aria-hidden />
            <span className="ml-1">Menu</span>
          </Button>
          <TechivanoLogo
            href="/dashboard"
            size="sm"
            compact="responsive"
            wordmark="product"
            markVariant="gold"
            motion="none"
            onClick={closeMobile}
            className="min-w-0"
          />
        </div>
        <header className="bg-app-header-glass border-border sticky top-0 z-20 border-b backdrop-blur-xl supports-[backdrop-filter]:backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3">
            <div className="min-w-0 flex flex-wrap items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <IvanoIQWordmarkInline className="text-sm" />
                <span className="text-muted-foreground text-xs leading-tight">
                  Operational Intelligence
                </span>
              </div>
              {isLoaded ? <RoleBadge role={role} /> : null}
              <SystemStatus />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isLoaded ? <NotificationBell /> : null}
              <CommandPalette role={role} />
              <Button variant="ghost" size="sm" asChild>
                <Link href="/settings">Settings</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">Home</Link>
              </Button>
              <UserButton />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
          {children}
        </main>
      </div>
    </div>
    </CommandPaletteProvider>
  );
}
