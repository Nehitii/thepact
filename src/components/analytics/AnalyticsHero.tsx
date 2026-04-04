import { motion } from "framer-motion";
import { Target, Zap, TrendingUp, Flame } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface HeroKPI {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  glowColor: string;
}

interface AnalyticsHeroProps {
  completionRate: number;
  totalXP: number;
  activeGoals: number;
  burnRate?: number; // remaining cost / month
  currency: string;
}

export function AnalyticsHero({ completionRate, totalXP, activeGoals, burnRate, currency }: AnalyticsHeroProps) {
  const kpis: HeroKPI[] = [
    {
      icon: Target,
      label: "Completion",
      value: `${completionRate}%`,
      subValue: "goal rate",
      color: "text-emerald-400",
      glowColor: "shadow-emerald-500/20",
    },
    {
      icon: Zap,
      label: "Total XP",
      value: totalXP.toLocaleString(),
      subValue: "points earned",
      color: "text-amber-400",
      glowColor: "shadow-amber-500/20",
    },
    {
      icon: Flame,
      label: "Active",
      value: activeGoals,
      subValue: "goals in progress",
      color: "text-orange-400",
      glowColor: "shadow-orange-500/20",
    },
    {
      icon: TrendingUp,
      label: "Burn Rate",
      value: burnRate !== undefined ? formatCurrency(burnRate, currency) : "—",
      subValue: "monthly avg",
      color: "text-blue-400",
      glowColor: "shadow-blue-500/20",
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
          className={cn(
            "relative p-4 rounded-xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur",
            "border border-border/50 overflow-hidden group",
            "hover:border-primary/30 transition-all duration-300"
          )}
        >
          {/* Glow effect on hover */}
          <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
            "bg-gradient-to-br from-transparent via-transparent to-primary/5"
          )} />
          
          {/* Icon */}
          <div className="flex items-center gap-2 mb-2">
            <kpi.icon className={cn("h-4 w-4", kpi.color)} />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </span>
          </div>
          
          {/* Value */}
          <p className="text-2xl md:text-3xl font-orbitron font-bold text-foreground relative z-10">
            {kpi.value}
          </p>
          
          {/* Sub value */}
          {kpi.subValue && (
            <p className="text-[10px] font-mono text-muted-foreground mt-1">
              {kpi.subValue}
            </p>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
