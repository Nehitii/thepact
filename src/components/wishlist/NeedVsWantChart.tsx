import { motion } from "framer-motion";
import { Shield, Sparkles, Trophy } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface NeedVsWantChartProps {
  requiredTotal: number;
  optionalTotal: number;
  acquiredTotal: number;
  currency: string;
}

export function NeedVsWantChart({ requiredTotal, optionalTotal, acquiredTotal, currency }: NeedVsWantChartProps) {
  const total = requiredTotal + optionalTotal;
  const requiredPct = total > 0 ? (requiredTotal / total) * 100 : 50;
  const optionalPct = total > 0 ? (optionalTotal / total) * 100 : 50;

  return (
    <div className="p-5 border border-cyan-500/15 bg-slate-950/60 backdrop-blur-xl space-y-4"
      style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}>
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-cyan-500/70">
          Need vs Want Analysis
        </h3>
        <span className="font-mono text-sm text-foreground font-bold">
          {formatCurrency(total, currency)}
        </span>
      </div>

      {/* Segmented bar */}
      <div className="relative h-5 overflow-hidden bg-slate-800/50 border border-slate-700/30"
        style={{ clipPath: "polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))" }}>
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500/80 to-amber-400/60"
          initial={{ width: 0 }}
          animate={{ width: `${requiredPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ boxShadow: "0 0 12px rgba(245,158,11,0.4)" }}
        />
        <motion.div
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-cyan-500/80 to-cyan-400/60"
          initial={{ width: 0 }}
          animate={{ width: `${optionalPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          style={{ boxShadow: "0 0 12px rgba(0,200,255,0.4)" }}
        />
        {total > 0 && (
          <div className="absolute inset-y-0 w-px bg-slate-950/80" style={{ left: `${requiredPct}%` }} />
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3 border border-amber-500/20 bg-amber-500/5"
          style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}>
          <Shield className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-cyan-500/50">Required</p>
            <p className="font-mono text-sm font-bold text-foreground truncate">
              {formatCurrency(requiredTotal, currency)}
            </p>
            <p className="text-xs text-amber-400/80 font-mono">{requiredPct.toFixed(0)}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 border border-cyan-500/20 bg-cyan-500/5"
          style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}>
          <Sparkles className="h-5 w-5 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-cyan-500/50">Optional</p>
            <p className="font-mono text-sm font-bold text-foreground truncate">
              {formatCurrency(optionalTotal, currency)}
            </p>
            <p className="text-xs text-cyan-400/80 font-mono">{optionalPct.toFixed(0)}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 border border-amber-500/20 bg-amber-500/5"
          style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}>
          <Trophy className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-cyan-500/50">Acquired</p>
            <p className="font-mono text-sm font-bold text-foreground truncate">
              {formatCurrency(acquiredTotal, currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
