import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: number;
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
  color = "text-cyan-400",
  size = "md",
  onClick,
}: TrendStatCardProps) {
  const hasTrend = trend !== undefined && !isNaN(trend);
  const trendColor = trend && trend > 0 ? "text-[#39ff14]" : trend && trend < 0 ? "text-[#ff003c]" : "text-gray-500";

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : undefined}
      onClick={onClick}
      className={cn(
        "relative bg-[#0a0a0c]/80 border border-gray-800 p-4 font-mono transition-all overflow-hidden group",
        onClick && "cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(0,255,255,0.15)]",
      )}
      style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
    >
      {/* Accent Line */}
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-cyan-500 to-transparent opacity-50 group-hover:opacity-100 transition-all" />

      <div className="relative z-10 flex items-center justify-between mb-3 pl-2">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4 drop-shadow-[0_0_5px_currentColor]", color)} />
          <span className="text-[10px] text-cyan-700/80 tracking-widest uppercase">
            SYS.{label.replace(/\s+/g, "_")}
          </span>
        </div>
        {hasTrend && (
          <div className={cn("flex items-center gap-1 bg-black/50 px-1.5 py-0.5 border border-gray-800", trendColor)}>
            <span className="text-[10px]">
              {trend > 0 ? "+" : ""}
              {trend?.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      <div className="relative z-10 flex items-end justify-between gap-4 pl-2">
        <div className="flex items-baseline gap-1">
          <span className="text-gray-700 text-xs">[</span>
          <p className="font-orbitron font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] text-2xl">
            {value}
          </p>
          <span className="text-gray-700 text-xs">]</span>
        </div>

        {/* Equalizer Sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="flex items-end gap-[2px] h-8 opacity-80">
            {sparklineData.slice(-12).map((v, i, arr) => {
              const max = Math.max(...arr);
              const height = max > 0 ? Math.max((v / max) * 100, 10) : 10;
              const isLast = i === arr.length - 1;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 transition-all rounded-sm",
                    isLast ? "bg-cyan-400 shadow-[0_0_8px_rgba(0,255,255,1)] animate-pulse" : "bg-cyan-900/50",
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
