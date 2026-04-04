import { motion } from "framer-motion";
import { Target, Zap, TrendingUp, Flame } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface AnalyticsHeroProps {
  completionRate: number;
  totalXP: number;
  activeGoals: number;
  burnRate?: number;
  currency: string;
}

export function AnalyticsHero({ completionRate, totalXP, activeGoals, burnRate, currency }: AnalyticsHeroProps) {
  const kpis = [
    { icon: Target, label: "Completion", value: `${completionRate}%`, subValue: "goal_rate", color: "text-[#39ff14]" },
    { icon: Zap, label: "Total_XP", value: totalXP.toLocaleString(), subValue: "pts_earned", color: "text-[#ffb000]" },
    { icon: Flame, label: "Active_Threads", value: activeGoals, subValue: "in_progress", color: "text-[#ff003c]" },
    {
      icon: TrendingUp,
      label: "Burn_Rate",
      value: burnRate !== undefined ? formatCurrency(burnRate, currency) : "—",
      subValue: "monthly_avg",
      color: "text-[#00f3ff]",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
    >
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="relative p-4 bg-[#050505] border border-gray-800/80 group overflow-hidden"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
        >
          {/* Cyberpunk Glow on Hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent to-cyan-500/10 pointer-events-none" />

          <div className="flex items-center gap-2 mb-2">
            <kpi.icon className={cn("h-4 w-4 drop-shadow-[0_0_3px_currentColor]", kpi.color)} />
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">SYS.{kpi.label}</span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-gray-800 text-sm">[</span>
            <p className="text-2xl md:text-3xl font-orbitron font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
              {kpi.value}
            </p>
            <span className="text-gray-800 text-sm">]</span>
          </div>

          {kpi.subValue && <p className="text-[9px] font-mono text-cyan-800 mt-1 uppercase">//{kpi.subValue}</p>}
        </motion.div>
      ))}
    </motion.div>
  );
}
