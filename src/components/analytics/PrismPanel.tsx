import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrismPanelProps {
  id?: string;
  title: string;
  unit?: string;
  children: ReactNode;
  className?: string;
  height?: "sm" | "md" | "lg" | "xl" | "auto";
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  footer?: ReactNode;
  accent?: "cyan" | "magenta" | "lime" | "violet" | "amber";
}

const HEIGHT_CLASS = {
  sm: "h-40",
  md: "h-56",
  lg: "h-72",
  xl: "h-96",
  auto: "",
};

const ACCENT_VAR: Record<string, string> = {
  cyan: "var(--prism-cyan)",
  magenta: "var(--prism-magenta)",
  lime: "var(--prism-lime)",
  violet: "var(--prism-violet)",
  amber: "var(--prism-amber)",
};

export function PrismPanel({
  id,
  title,
  unit,
  children,
  className = "",
  height = "md",
  isLoading,
  isEmpty,
  emptyMessage = "No data available",
  footer,
  accent = "cyan",
}: PrismPanelProps) {
  return (
    <div
      className={cn("prism-panel relative p-5", className)}
      style={{ ["--prism-panel-border" as any]: ACCENT_VAR[accent] }}
    >
      <span className="prism-corner-bracket tl" />
      <span className="prism-corner-bracket tr" />
      <span className="prism-corner-bracket bl" />
      <span className="prism-corner-bracket br" />
      <div className="prism-scanline motion-reduce:hidden opacity-60" />

      <header className="relative flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {id && (
            <span className="font-mono text-[9px] tabular-nums text-muted-foreground/50">
              [{id}]
            </span>
          )}
          <h3 className="font-orbitron text-[11px] uppercase tracking-[0.2em] text-foreground/90 truncate">
            {title}
          </h3>
        </div>
        {unit && (
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60 flex-shrink-0">
            · {unit}
          </span>
        )}
      </header>

      <div className={cn("relative", HEIGHT_CLASS[height])}>
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Skeleton className="w-full h-full rounded-sm" />
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={BarChart3}
            title={emptyMessage}
            description="Start tracking to see this signal"
          />
        ) : (
          children
        )}
      </div>

      {footer && (
        <footer className="relative mt-4 pt-3 border-t border-[hsl(var(--prism-cyan))]/10">
          {footer}
        </footer>
      )}
    </div>
  );
}
