import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: number; // percentage change vs previous period
  sparklineData?: number[];
  color?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function TrendStatCard({
  icon: Icon,
  label,
  value,
  trend,
  sparklineData,
  color = "text-primary",
  size = "md",
  onClick,
}: TrendStatCardProps) {
  const hasTrend = trend !== undefined && !isNaN(trend);
  const trendColor = trend && trend > 0 ? "text-emerald-400" : trend && trend < 0 ? "text-red-400" : "text-muted-foreground";
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;

  const sizeClasses = {
    sm: { card: "p-3", value: "text-xl", label: "text-[9px]" },
    md: { card: "p-4", value: "text-2xl", label: "text-[10px]" },
    lg: { card: "p-5", value: "text-3xl", label: "text-[11px]" },
  };

  const classes = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      onClick={onClick}
      className={cn(
        "rounded-xl bg-card/60 backdrop-blur border border-border/50 transition-all",
        classes.card,
        onClick && "cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", color)} />
          <span className={cn("font-mono uppercase tracking-wider text-muted-foreground", classes.label)}>
            {label}
          </span>
        </div>
        {hasTrend && (
          <div className={cn("flex items-center gap-1", trendColor)}>
            <TrendIcon className="h-3 w-3" />
            <span className="text-[10px] font-mono">
              {trend > 0 ? "+" : ""}{trend.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-4">
        <p className={cn("font-orbitron font-bold text-foreground", classes.value)}>{value}</p>
        
        {/* Mini Sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="flex items-end gap-0.5 h-6">
            {sparklineData.slice(-12).map((v, i, arr) => {
              const max = Math.max(...arr);
              const height = max > 0 ? Math.max((v / max) * 100, 5) : 5;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-all",
                    i === arr.length - 1 ? "bg-primary" : "bg-primary/30"
                  )}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
