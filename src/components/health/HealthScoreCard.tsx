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

function getStatusLabel(score: number): { text: string; color: string } {
  if (score >= 80) return { text: "OPTIMAL", color: "text-hud-phosphor" };
  if (score >= 50) return { text: "ATTENTION", color: "text-hud-amber" };
  return { text: "CRITICAL", color: "text-destructive" };
}

function getScoreGlowColor(score: number): string {
  if (score >= 80) return "hsl(var(--hud-phosphor))";
  if (score >= 50) return "hsl(212, 90%, 60%)";
  return "hsl(var(--hud-amber))";
}

export function HealthScoreCard({ score, trend, factors }: HealthScoreCardProps) {
  const { t } = useTranslation();
  const status = getStatusLabel(score);
  const scoreGlow = getScoreGlowColor(score);

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

  const circumference60 = 2 * Math.PI * 60;
  const circumference72 = 2 * Math.PI * 72;
  const circumference84 = 2 * Math.PI * 84;

  // Color-coded inner ring based on score
  const innerRingColor = score >= 80
    ? "hsl(var(--hud-phosphor))"
    : score >= 50
      ? "hsl(212, 90%, 60%)"
      : "hsl(var(--hud-amber))";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <HUDFrame className="p-8" scanLine active={score >= 80} glowColor={scoreGlow}>
        <div className="relative flex flex-col lg:flex-row items-center gap-8">
          {/* Heartbeat pulse ring behind disk */}
          <div className="absolute left-1/2 lg:left-24 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 pointer-events-none">
            <motion.div
              className="absolute inset-0 rounded-full border border-hud-phosphor/20"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{
                duration: score >= 80 ? 1.5 : score >= 50 ? 2.5 : 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Segmented Radar Disk */}
          <div className="relative flex-shrink-0 w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              {/* Background rings */}
              <circle cx="100" cy="100" r="60" fill="none" stroke="hsl(var(--hud-phosphor) / 0.1)" strokeWidth="4" />
              <circle cx="100" cy="100" r="72" fill="none" stroke="hsl(var(--hud-phosphor) / 0.08)" strokeWidth="3" />
              <circle cx="100" cy="100" r="84" fill="none" stroke="hsl(var(--hud-phosphor) / 0.06)" strokeWidth="3" />

              {/* Inner ring: overall score - color-coded */}
              <motion.circle
                cx="100" cy="100" r="60"
                fill="none"
                stroke={innerRingColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference60}
                initial={{ strokeDashoffset: circumference60 }}
                animate={{ strokeDashoffset: circumference60 - (circumference60 * score) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                transform="rotate(-90 100 100)"
                style={{ filter: `drop-shadow(0 0 6px ${innerRingColor})` }}
              />

              {/* Middle ring: sleep factor (blue) */}
              <motion.circle
                cx="100" cy="100" r="72"
                fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${circumference72 * 0.3} ${circumference72 * 0.05}`}
                initial={{ strokeDashoffset: circumference72 }}
                animate={{ strokeDashoffset: circumference72 * 0.3 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                transform="rotate(-90 100 100)"
              />

              {/* Outer ring: rotating */}
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "100px 100px" }}
              >
                <circle cx="100" cy="100" r="84" fill="none" stroke="hsl(var(--hud-phosphor))" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${circumference84 * 0.2} ${circumference84 * 0.05} ${circumference84 * 0.15} ${circumference84 * 0.6}`}
                  transform="rotate(-90 100 100)" />
                <circle cx="100" cy="100" r="84" fill="none" stroke="hsl(var(--hud-amber))" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${circumference84 * 0.15} ${circumference84 * 0.85}`}
                  transform="rotate(90 100 100)" />
              </motion.g>
            </svg>

            {/* Center score + status label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <motion.span
                  className="text-5xl font-bold font-orbitron text-hud-phosphor"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{ filter: `drop-shadow(0 0 8px ${scoreGlow})` }}
                >
                  {score}
                </motion.span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mt-1">
                  {t("health.scores.healthScore")}
                </p>
                <motion.p
                  className={cn("text-[10px] font-mono font-bold tracking-widest mt-0.5", status.color)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  STATUS: {status.text}
                </motion.p>
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

            {/* Data ticker */}
            <div className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider border-t border-border/30 pt-2">
              TREND: {trend.toUpperCase()} · FACTORS: {factors.length || "—"} · SYNC: LIVE
            </div>
          </div>
        </div>
      </HUDFrame>
    </motion.div>
  );
}
