import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  isEmpty?: boolean;
  emptyContent?: ReactNode;
  height?: "sm" | "md" | "lg" | "xl";
}

const HEIGHTS: Record<NonNullable<Props["height"]>, string> = {
  sm: "h-[180px]",
  md: "h-[240px]",
  lg: "h-[300px]",
  xl: "h-[360px]",
};

export function CleanCard({
  title,
  subtitle,
  action,
  children,
  className,
  isEmpty,
  emptyContent,
  height = "lg",
}: Props) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-5 flex flex-col",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </header>
      <div className={cn("flex-1 min-h-0", HEIGHTS[height])}>
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground/70 text-center px-6">
            {emptyContent ?? "Pas encore de données"}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}