import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  height?: "sm" | "md" | "lg";
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export function ChartCard({
  title,
  children,
  className = "",
  height = "md",
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No data available",
}: ChartCardProps) {
  const heightClass = {
    sm: "h-40",
    md: "h-56",
    lg: "h-72",
  };

  return (
    <div className={cn(
      "p-5 rounded-xl bg-card/60 backdrop-blur border border-border/50",
      className
    )}>
      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
        {title}
      </h3>
      <div className={heightClass[height]}>
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={BarChart3}
            title={emptyMessage}
            description="Start tracking to see your progress here"
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
