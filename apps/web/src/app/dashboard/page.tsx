import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ComplianceTermsGate } from "@/components/dashboard/compliance-terms-gate";
import {
  DashboardChartSkeleton,
  DashboardKpiSkeleton,
  DashboardSecondaryKpiSkeleton,
  DashboardTableSkeleton
} from "@/components/dashboard/dashboard-skeletons";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardViewFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-48 rounded-md bg-muted" />
      <DashboardKpiSkeleton />
      <DashboardSecondaryKpiSkeleton />
      <DashboardChartSkeleton />
      <DashboardTableSkeleton />
    </div>
  );
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  return (
    <DashboardLayout>
      <ComplianceTermsGate>
        <Suspense fallback={<DashboardViewFallback />}>
          <DashboardView />
        </Suspense>
      </ComplianceTermsGate>
    </DashboardLayout>
  );
}
