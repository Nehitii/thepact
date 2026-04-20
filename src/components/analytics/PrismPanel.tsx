import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PrismBadge } from "./PrismBadge";
import { PrismSkeleton } from "./PrismSkeleton";

export type PrismPanelStatus = "live" | "stale" | "empty" | "offline";
export type PrismPanelTier = "primary" | "secondary" | "muted";

interface PrismPanelProps {
  id?: string;
  title: string;
  unit?: string;
  children: ReactNode;
  className?: string;
  height?: "sm" | "md" | "lg" | "xl" | "auto";
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyContent?: ReactNode;
  emptyMessage?: string;
  footer?: ReactNode;
  accent?: "cyan" | "magenta" | "lime" | "violet" | "amber";
  status?: PrismPanelStatus;
  showStatus?: boolean;
  tier?: PrismPanelTier;
  flicker?: boolean;
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
  emptyContent,
  emptyMessage = "NO SIGNAL DETECTED",
  footer,
  accent = "cyan",
  status,
  showStatus = true,
  tier = "secondary",
  flicker = false,
}: PrismPanelProps) {
  const resolvedStatus: PrismPanelStatus =
    status ?? (isLoading ? "stale" : isEmpty ? "empty" : "live");

  const tierClass =
    tier === "primary"
      ? "prism-panel--primary p-5"
      : tier === "muted"
        ? "prism-panel--muted p-3"
        : "p-5";

  const showBrackets = tier !== "muted";

  return (
    <div
      className={cn(
        "prism-panel relative",
        tierClass,
        flicker && "prism-flicker",
        className,
      )}
      style={{ ["--prism-panel-border" as any]: ACCENT_VAR[accent] }}
    >
      {showBrackets && (
        <>
          <span className="prism-corner-bracket tl" />
          <span className="prism-corner-bracket tr" />
          <span className="prism-corner-bracket bl" />
          <span className="prism-corner-bracket br" />
        </>
      )}

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
          {unit && (
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60 flex-shrink-0">
              · {unit}
            </span>
          )}
        </div>
        {showStatus && <PrismBadge variant={resolvedStatus} />}
      </header>

      <div className={cn("relative", HEIGHT_CLASS[height])}>
        {isLoading ? (
          <PrismSkeleton />
        ) : isEmpty ? (
          emptyContent ?? <DefaultEmpty message={emptyMessage} />
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

function DefaultEmpty({ message }: { message: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <div
        className="h-12 w-12 rounded-full border border-[hsl(var(--prism-cyan)/0.3)] flex items-center justify-center"
        style={{ animation: "prism-pulse-cyan 2.4s ease-in-out infinite" }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--prism-cyan))]" />
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
        {message}
      </span>
    </div>
  );
}
