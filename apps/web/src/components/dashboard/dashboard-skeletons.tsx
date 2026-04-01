import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardKpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card
          key={i}
          className="overflow-hidden border border-white/5 shadow-lg shadow-black/20"
        >
          <CardHeader className="space-y-2 pb-2">
            <Skeleton className="h-3 w-24 animate-pulse rounded-md bg-white/5" />
            <Skeleton className="h-8 w-16 animate-pulse rounded-md bg-white/5" />
            <Skeleton className="h-3 w-full max-w-[8rem] animate-pulse rounded-md bg-white/5" />
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
          className="h-24 animate-pulse rounded-xl border border-white/5 bg-white/5 shadow-lg shadow-black/20"
        />
      ))}
    </div>
  );
}

export function DashboardChartSkeleton() {
  return (
    <Skeleton className="h-72 w-full animate-pulse rounded-xl border border-white/5 bg-white/5 shadow-lg shadow-black/20" />
  );
}

export function DashboardTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-full animate-pulse rounded-md bg-white/5" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-10 w-full animate-pulse rounded-md bg-white/5"
        />
      ))}
    </div>
  );
}
