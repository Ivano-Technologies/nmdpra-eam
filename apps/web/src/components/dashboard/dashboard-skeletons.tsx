import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardKpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card
          key={i}
          className="border-border overflow-hidden border shadow-lg shadow-black/10 dark:shadow-black/20"
        >
          <CardHeader className="space-y-2 pb-2">
            <Skeleton className="bg-muted h-3 w-24 animate-pulse rounded-md" />
            <Skeleton className="bg-muted h-8 w-16 animate-pulse rounded-md" />
            <Skeleton className="bg-muted h-3 w-full max-w-[8rem] animate-pulse rounded-md" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export function DashboardSecondaryKpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton
          key={i}
          className="bg-muted h-24 animate-pulse rounded-xl border border-border shadow-lg shadow-black/10 dark:shadow-black/20"
        />
      ))}
    </div>
  );
}

export function DashboardChartSkeleton() {
  return (
    <Skeleton className="bg-muted h-72 w-full animate-pulse rounded-xl border border-border shadow-lg shadow-black/10 dark:shadow-black/20" />
  );
}

export function DashboardTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="bg-muted h-8 w-full animate-pulse rounded-md" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          className="bg-muted h-10 w-full animate-pulse rounded-md"
        />
      ))}
    </div>
  );
}
