import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

/**
 * Client role: no admin API data — polished empty state with static CTAs (no new APIs).
 */
export function ClientDashboardPlaceholder() {
  return (
    <section
      id="section-client"
      className="scroll-mt-28 space-y-6"
      aria-labelledby="client-dashboard-heading"
    >
      <div>
        <h1
          id="client-dashboard-heading"
          className="text-2xl font-semibold tracking-tight"
        >
          Your overview
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Limited access — organisation analytics and reports are available to
          administrators.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Licences", "Vendors", "Reports", "Alerts"].map((label) => (
          <Card
            key={label}
            className="transition-shadow duration-150 hover:shadow-md"
          >
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-muted-foreground text-2xl tabular-nums">
                —
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-xs">
              Connect an admin account to see live data.
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Need full access?</CardTitle>
          <CardDescription>
            Ask your organisation owner or admin to grant you an elevated role,
            or contact support for enterprise onboarding.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button type="button" asChild>
            <a href="mailto:?subject=RMLIS%20access%20request">
              Contact administrator
            </a>
          </Button>
          <Button variant="secondary" type="button" asChild>
            <a href="/api/reports/mvp.pdf" target="_blank" rel="noreferrer">
              View sample MVP PDF
            </a>
          </Button>
          <Button variant="outline" type="button" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
