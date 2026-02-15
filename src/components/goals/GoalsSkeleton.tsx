import { Skeleton } from "@/components/ui/skeleton";

interface GoalsSkeletonProps {
  mode?: "bar" | "grid" | "bookmark";
  count?: number;
}

function BarSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-card/60 border border-border">
      <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="w-full max-w-[340px] aspect-[4/5] rounded-[20px] bg-card/60 border border-border overflow-hidden">
      <Skeleton className="h-3/5 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  );
}

export function GoalsSkeleton({ mode = "bar", count = 4 }: GoalsSkeletonProps) {
  const isGrid = mode === "grid" || mode === "bookmark";

  return (
    <div
      className={
        isGrid
          ? "flex flex-wrap justify-center gap-6"
          : "grid grid-cols-1 gap-4 w-full max-w-4xl mx-auto"
      }
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-in fade-in duration-300" style={{ animationDelay: `${i * 80}ms` }}>
          {isGrid ? <GridSkeleton /> : <BarSkeleton />}
        </div>
      ))}
    </div>
  );
}
