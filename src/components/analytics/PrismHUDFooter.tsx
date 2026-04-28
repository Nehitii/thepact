import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyticsPeriod } from "./PeriodSelector";
import type { PrismSection } from "./PrismRail";

interface PrismHUDFooterProps {
  period: AnalyticsPeriod;
  section: PrismSection;
  liveModules: number;
  totalModules: number;
  className?: string;
}

const PERIOD_LABEL: Record<AnalyticsPeriod, string> = {
  "30d": "LAST 30D",
  "90d": "LAST 90D",
  "6m": "LAST 6M",
  all: "ALL TIME",
};

export function PrismHUDFooter({
  period,
  section,
  liveModules,
  totalModules,
  className,
}: PrismHUDFooterProps) {
  return (
    <div
      className={cn(
        "prism-hud-footer mt-6 px-4 h-9 flex items-center gap-4 text-[9px] font-mono uppercase tracking-[0.22em] text-muted-foreground/70 rounded-sm",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-1.5 text-[hsl(var(--prism-lime))]">
        <Activity className="h-2.5 w-2.5" /> LIVE
      </span>
      <span className="text-muted-foreground/30">·</span>
      <span className="prism-text-cyan">{PERIOD_LABEL[period]}</span>
      <span className="text-muted-foreground/30">·</span>
      <span className="hidden sm:inline">SECTION ▸ {section.toUpperCase()}</span>
      <span className="ml-auto hidden md:inline">
        {liveModules}/{totalModules} signals
      </span>
      <span className="hidden md:inline text-muted-foreground/30">·</span>
      <span className="hidden md:inline">⌨ 1–6 · ←→ period · F focus · ? help</span>
    </div>
  );
}