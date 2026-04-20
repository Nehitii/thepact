import { motion } from "framer-motion";
import { Activity, Radio } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PeriodSelector, AnalyticsPeriod } from "./PeriodSelector";
import type { HeadlineInsight } from "@/lib/analyticsInsights";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const stableSid = useMemo(() => {
    if (!user?.id) return sessionId;
    const id = user.id.replace(/-/g, "");
    const a = id.slice(0, 4).toUpperCase();
    const b = id.slice(-4).toUpperCase();
    return `${a}-${b}`;
  }, [user?.id, sessionId]);

  const ts = now.toISOString().slice(11, 19);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="prism-panel prism-panel--primary relative pl-7 pr-5 py-4 mb-6"
    >
      <span className="prism-corner-bracket tl" />
      <span className="prism-corner-bracket tr" />
      <span className="prism-corner-bracket bl" />
      <span className="prism-corner-bracket br" />

      {/* Lateral neon accent */}
      <div
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--prism-cyan) / 0.85), hsl(var(--prism-cyan) / 0.25))",
          boxShadow: "0 0 10px hsl(var(--prism-cyan) / 0.5)",
        }}
      >
        <span
          className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-[hsl(var(--prism-cyan))] motion-reduce:animate-none"
          style={{ animation: "prism-pulse-cyan 2s ease-in-out infinite" }}
        />
      </div>

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="h-3 w-3 prism-text-cyan animate-pulse motion-reduce:animate-none" />
            <span className="font-orbitron text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              PRISM // OBSERVATORY
            </span>
            <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground/60">
              · v2.1
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
            <span className="flex items-center gap-1 text-[hsl(var(--prism-lime))]">
              <Activity className="h-2.5 w-2.5" />
              LIVE
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums">T+{ts}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="hidden sm:inline">SID-{stableSid}</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <PeriodSelector value={period} onChange={onPeriodChange} />
        </div>
      </div>
    </motion.div>
  );
}
