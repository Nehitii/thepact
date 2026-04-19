import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VitalSign {
  id?: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: number;
  sparkline?: number[];
  accent?: "cyan" | "magenta" | "lime" | "violet" | "amber";
}

interface InsightStripProps {
  signs: VitalSign[];
}

const ACCENT_TEXT: Record<string, string> = {
  cyan: "prism-text-cyan",
  magenta: "prism-text-magenta",
  lime: "prism-text-lime",
  violet: "prism-text-violet",
  amber: "prism-text-amber",
};

const ACCENT_VAR: Record<string, string> = {
  cyan: "var(--prism-cyan)",
  magenta: "var(--prism-magenta)",
  lime: "var(--prism-lime)",
  violet: "var(--prism-violet)",
  amber: "var(--prism-amber)",
};

export function InsightStrip({ signs }: InsightStripProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {signs.map((s, idx) => {
        const Icon = s.icon;
        const accent = s.accent || "cyan";
        const hasDelta = typeof s.delta === "number" && !isNaN(s.delta);
        const TrendIcon =
          s.delta && s.delta > 0 ? TrendingUp : s.delta && s.delta < 0 ? TrendingDown : Minus;
        const trendColor =
          s.delta && s.delta > 0
            ? "prism-text-lime"
            : s.delta && s.delta < 0
            ? "prism-text-magenta"
            : "text-muted-foreground";

        return (
          <motion.div
            key={s.label + idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="prism-panel relative p-3.5 group"
            style={{ ["--prism-panel-border" as any]: ACCENT_VAR[accent] }}
          >
            <span className="prism-corner-bracket tl" />
            <span className="prism-corner-bracket br" />

            <div className="relative flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Icon className={cn("h-3 w-3 flex-shrink-0", ACCENT_TEXT[accent])} />
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80 truncate">
                  {s.label}
                </span>
              </div>
              {hasDelta && (
                <div className={cn("flex items-center gap-0.5 flex-shrink-0", trendColor)}>
                  <TrendIcon className="h-2.5 w-2.5" />
                  <span className="font-mono text-[9px] tabular-nums">
                    {s.delta! > 0 ? "+" : ""}
                    {s.delta!.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>

            <div className="relative flex items-end justify-between gap-2">
              <p
                className={cn(
                  "font-mono font-bold text-xl md:text-2xl tabular-nums leading-none truncate",
                  ACCENT_TEXT[accent],
                )}
              >
                {s.value}
              </p>

              {s.sparkline && s.sparkline.length > 1 && (
                <div className="flex items-end gap-[1.5px] h-6 flex-shrink-0">
                  {s.sparkline.slice(-10).map((v, i, arr) => {
                    const max = Math.max(...arr, 1);
                    const h = Math.max((v / max) * 100, 6);
                    return (
                      <div
                        key={i}
                        className="w-[2px] rounded-full"
                        style={{
                          height: `${h}%`,
                          background:
                            i === arr.length - 1
                              ? `hsl(${ACCENT_VAR[accent]})`
                              : `hsl(${ACCENT_VAR[accent]} / 0.35)`,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
