import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { HUDFrame } from "./HUDFrame";

interface HealthScoreCardProps {
  score: number;
  trend: "up" | "down" | "stable";
  factors: string[];
}

export function HealthScoreCard({ score, trend, factors }: HealthScoreCardProps) {
  const { t } = useTranslation();

  const getTrendIcon = () => {
    switch (trend) {
      case "up": return <TrendingUp className="w-5 h-5 text-hud-phosphor" />;
      case "down": return <TrendingDown className="w-5 h-5 text-hud-amber" />;
      default: return <Minus className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTrendLabel = () => {
    switch (trend) {
      case "up": return t("health.scores.trend") + " ↑";
      case "down": return t("health.scores.trend") + " ↓";
      default: return t("health.scores.trend");
    }
  };

  // Multi-ring orbital data
  const circumference60 = 2 * Math.PI * 60;
  const circumference72 = 2 * Math.PI * 72;
  const circumference84 = 2 * Math.PI * 84;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <HUDFrame className="p-8" scanLine>
        <div className="relative flex flex-col lg:flex-row items-center gap-8">
          {/* Segmented Radar Disk */}
          <div className="relative flex-shrink-0 w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              {/* Background rings */}
              <circle cx="100" cy="100" r="60" fill="none" stroke="hsl(var(--hud-phosphor) / 0.1)" strokeWidth="4" />
              <circle cx="100" cy="100" r="72" fill="none" stroke="hsl(var(--hud-phosphor) / 0.08)" strokeWidth="3" />
              <circle cx="100" cy="100" r="84" fill="none" stroke="hsl(var(--hud-phosphor) / 0.06)" strokeWidth="3" />

              {/* Inner ring: overall score */}
              <motion.circle
                cx="100" cy="100" r="60"
                fill="none"
                stroke="hsl(var(--hud-phosphor))"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference60}
                initial={{ strokeDashoffset: circumference60 }}
                animate={{ strokeDashoffset: circumference60 - (circumference60 * score) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                transform="rotate(-90 100 100)"
              />

              {/* Middle ring: sleep factor (blue) */}
              <motion.circle
                cx="100" cy="100" r="72"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${circumference72 * 0.3} ${circumference72 * 0.05}`}
                initial={{ strokeDashoffset: circumference72 }}
                animate={{ strokeDashoffset: circumference72 * 0.3 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                transform="rotate(-90 100 100)"
              />

              {/* Outer ring: activity (cyan) + stress (amber) - rotating */}
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "100px 100px" }}
              >
                <circle
                  cx="100" cy="100" r="84"
                  fill="none"
                  stroke="hsl(var(--hud-phosphor))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference84 * 0.2} ${circumference84 * 0.05} ${circumference84 * 0.15} ${circumference84 * 0.6}`}
                  transform="rotate(-90 100 100)"
                />
                <circle
                  cx="100" cy="100" r="84"
                  fill="none"
                  stroke="hsl(var(--hud-amber))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference84 * 0.15} ${circumference84 * 0.85}`}
                  transform="rotate(90 100 100)"
                />
              </motion.g>
            </svg>

            {/* Center score */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <motion.span
                  className="text-5xl font-bold font-orbitron text-hud-phosphor"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {score}
                </motion.span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mt-1">
                  {t("health.scores.healthScore")}
                </p>
              </div>
            </div>
          </div>
          
          {/* Score Details */}
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {t("health.scores.weeklyAverage")}
              </h2>
              <div className="flex items-center justify-center lg:justify-start gap-2">
                {getTrendIcon()}
                <span className={cn(
                  "text-sm font-medium font-mono uppercase tracking-wider",
                  trend === "up" && "text-hud-phosphor",
                  trend === "down" && "text-hud-amber",
                  trend === "stable" && "text-muted-foreground"
                )}>
                  {getTrendLabel()}
                </span>
              </div>
            </div>
            
            {factors.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {factors.map((factor, i) => (
                  <motion.span
                    key={factor}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="px-3 py-1 text-xs font-medium font-mono uppercase tracking-wider bg-hud-phosphor/10 text-hud-phosphor border border-hud-phosphor/20"
                    style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
                  >
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    {factor}
                  </motion.span>
                ))}
              </div>
            )}
            
            {factors.length === 0 && (
              <p className="text-muted-foreground/70 text-sm font-mono">
                {t("health.dailyCheckin")}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground/50 font-mono">
              {t("health.disclaimer")}
            </p>
          </div>
        </div>
      </HUDFrame>
    </motion.div>
  );
}
