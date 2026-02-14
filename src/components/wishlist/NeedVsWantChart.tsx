import { useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface NeedVsWantChartProps {
  requiredTotal: number;
  optionalTotal: number;
  currency: string;
}

export function NeedVsWantChart({ requiredTotal, optionalTotal, currency }: NeedVsWantChartProps) {
  const total = requiredTotal + optionalTotal;
  const requiredPct = total > 0 ? (requiredTotal / total) * 100 : 50;
  const optionalPct = total > 0 ? (optionalTotal / total) * 100 : 50;

  return (
    <div className="p-5 rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-orbitron text-xs tracking-[0.2em] uppercase text-primary/80">
          Need vs Want Analysis
        </h3>
        <span className="font-orbitron text-sm text-foreground font-bold">
          {formatCurrency(total, currency)}
        </span>
      </div>

      {/* Segmented bar */}
      <div className="relative h-6 rounded-full overflow-hidden bg-muted/30 border border-border/50">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-destructive/80 to-destructive/60"
          initial={{ width: 0 }}
          animate={{ width: `${requiredPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ boxShadow: "0 0 12px hsl(var(--destructive) / 0.4)" }}
        />
        <motion.div
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-primary/80 to-primary/60"
          initial={{ width: 0 }}
          animate={{ width: `${optionalPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          style={{ boxShadow: "0 0 12px hsl(var(--primary) / 0.4)" }}
        />
        {/* Center divider */}
        {total > 0 && (
          <div
            className="absolute inset-y-0 w-px bg-background/80"
            style={{ left: `${requiredPct}%` }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-destructive/20 bg-destructive/5">
          <Shield className="h-5 w-5 text-destructive shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-rajdhani uppercase tracking-wider text-muted-foreground">Required</p>
            <p className="font-orbitron text-sm font-bold text-foreground truncate">
              {formatCurrency(requiredTotal, currency)}
            </p>
            <p className="text-xs text-destructive/80">{requiredPct.toFixed(0)}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-rajdhani uppercase tracking-wider text-muted-foreground">Optional</p>
            <p className="font-orbitron text-sm font-bold text-foreground truncate">
              {formatCurrency(optionalTotal, currency)}
            </p>
            <p className="text-xs text-primary/80">{optionalPct.toFixed(0)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
