import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { DangerZone } from "@/components/settings/danger-zone";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Privacy, data lifecycle, and account-related actions.
          </p>
        </div>
        <ThemeSettings />
        <DangerZone />
      </div>
    </DashboardLayout>
  );
}
