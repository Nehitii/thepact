import { motion } from "framer-motion";
import { Activity, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { PeriodSelector, AnalyticsPeriod } from "./PeriodSelector";
import type { HeadlineInsight } from "@/lib/analyticsInsights";
import { cn } from "@/lib/utils";

interface PrismHeadlineProps {
  insight: HeadlineInsight;
  period: AnalyticsPeriod;
  onPeriodChange: (p: AnalyticsPeriod) => void;
  sessionId: string;
}

const TONE_COLOR: Record<string, string> = {
  exceptional: "prism-text-lime",
  positive: "prism-text-cyan",
  stable: "prism-text-cyan",
  negative: "prism-text-magenta",
  neutral: "prism-text-cyan",
};

const TONE_PULSE: Record<string, string> = {
  exceptional: "bg-[hsl(var(--prism-lime))]",
  positive: "bg-[hsl(var(--prism-cyan))]",
  stable: "bg-[hsl(var(--prism-cyan))]",
  negative: "bg-[hsl(var(--prism-magenta))]",
  neutral: "bg-[hsl(var(--prism-cyan))]",
};

export function PrismHeadline({ insight, period, onPeriodChange, sessionId }: PrismHeadlineProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ts = now.toISOString().slice(11, 19);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="prism-panel relative px-5 py-4 mb-6"
    >
      <span className="prism-corner-bracket tl" />
      <span className="prism-corner-bracket tr" />
      <span className="prism-corner-bracket bl" />
      <span className="prism-corner-bracket br" />
      <div className="prism-scanline motion-reduce:hidden" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="h-3 w-3 prism-text-cyan animate-pulse motion-reduce:animate-none" />
            <span className="font-orbitron text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              PRISM // OBSERVATORY
            </span>
            <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground/60">
              · v2.0
            </span>
          </div>

          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-2 h-2 w-2 rounded-full motion-reduce:animate-none",
                TONE_PULSE[insight.tone],
              )}
              style={{
                animation:
                  insight.tone === "negative"
                    ? "prism-pulse-magenta 2s ease-in-out infinite"
                    : "prism-pulse-cyan 2s ease-in-out infinite",
              }}
            />
            <h1
              className={cn(
                "font-orbitron text-xl md:text-2xl font-bold tracking-tight",
                TONE_COLOR[insight.tone],
              )}
            >
              {insight.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
            <span className="flex items-center gap-1">
              <Activity className="h-2.5 w-2.5" />
              LIVE
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span>T+{ts}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="hidden sm:inline">SESSION {sessionId}</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <PeriodSelector value={period} onChange={onPeriodChange} />
        </div>
      </div>
    </motion.div>
  );
}
