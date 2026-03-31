import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ComplianceTermsGate } from "@/components/dashboard/compliance-terms-gate";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  return (
    <DashboardLayout>
      <ComplianceTermsGate>
        <DashboardView />
      </ComplianceTermsGate>
    </DashboardLayout>
  );
}
