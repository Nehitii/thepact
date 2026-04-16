import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayHealth, useWeeklyHealth } from "@/hooks/useHealth";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { HUDFrame } from "./HUDFrame";

interface HealthMetricCardProps {
  icon: LucideIcon;
  title: string;
  color: "blue" | "cyan" | "amber" | "orange";
  metricKey: "sleep" | "activity" | "stress" | "hydration" | "nutrition";
}

const colorVariants = {
  blue: {
    icon: "text-blue-400",
    glow: "hsl(217, 91%, 60%)",
    accent: "#3b82f6",
    track: "stroke-blue-400/20",
    fill: "stroke-blue-400",
    gradFrom: "from-blue-500/10",
    sparkStroke: "#60a5fa",
    badge: "P1",
  },
  cyan: {
    icon: "text-hud-phosphor",
    glow: "hsl(var(--hud-phosphor))",
    accent: "hsl(187, 100%, 50%)",
    track: "stroke-hud-phosphor/20",
    fill: "stroke-hud-phosphor",
    gradFrom: "from-hud-phosphor/10",
    sparkStroke: "hsl(187, 100%, 50%)",
    badge: "P1",
  },
  amber: {
    icon: "text-hud-amber",
    glow: "hsl(var(--hud-amber))",
    accent: "hsl(43, 100%, 50%)",
    track: "stroke-hud-amber/20",
    fill: "stroke-hud-amber",
    gradFrom: "from-hud-amber/10",
    sparkStroke: "hsl(43, 100%, 50%)",
    badge: "P2",
  },
  orange: {
    icon: "text-orange-400",
    glow: "hsl(25, 95%, 53%)",
    accent: "#f97316",
    track: "stroke-orange-400/20",
    fill: "stroke-orange-400",
    gradFrom: "from-orange-500/10",
    sparkStroke: "#fb923c",
    badge: "P3",
  },
};

function getStatusColor(value: number | null, metricKey: string): "green" | "amber" | "red" | "off" {
  if (value === null) return "off";
  if (metricKey === "stress") {
    if (value <= 2) return "green";
    if (value <= 3) return "amber";
    return "red";
  }
  if (value >= 4) return "green";
  if (value >= 3) return "amber";
  return "red";
}

const ledColors = {
  green: "bg-emerald-400 shadow-[0_0_8px_hsl(142,70%,50%)]",
  amber: "bg-hud-amber shadow-[0_0_8px_hsl(43,100%,50%)]",
  red: "bg-destructive shadow-[0_0_8px_hsl(0,85%,60%)]",
  off: "bg-muted-foreground/30",
};

export function HealthMetricCard({ icon: Icon, title, color, metricKey }: HealthMetricCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: todayData } = useTodayHealth(user?.id);
  const { data: weeklyData } = useWeeklyHealth(user?.id);

  const colors = colorVariants[color];

  const getTodayValue = (): number | null => {
    if (!todayData) return null;
    switch (metricKey) {
      case "sleep": return todayData.sleep_quality;
      case "activity": return todayData.activity_level;
      case "stress": return todayData.stress_level;
      case "hydration": return todayData.hydration_glasses;
      case "nutrition": return todayData.meal_balance;
      default: return null;
    }
  };

  // Build sparkline data from weekly data (7 most recent days)
  const sparkData = (weeklyData || []).slice(-7).map((d) => {
    let v: number | null = null;
    switch (metricKey) {
      case "sleep": v = d.sleep_quality; break;
      case "activity": v = d.activity_level; break;
      case "stress": v = d.stress_level ? 6 - d.stress_level : null; break;
      case "hydration": v = d.hydration_glasses ? Math.min(d.hydration_glasses / 8 * 5, 5) : null; break;
      case "nutrition": v = d.meal_balance; break;
    }
    return v ?? 0;
  });

  // Pad to 7 points
  while (sparkData.length < 7) sparkData.unshift(0);

  const getWeeklyAverage = (): number => {
    const validValues = sparkData.filter((v) => v > 0);
    if (validValues.length === 0) return 0;
    return validValues.reduce((a, b) => a + b, 0) / validValues.length;
  };

  const getDisplayValue = (): string => {
    const value = getTodayValue();
    if (value === null) return "—";
    if (metricKey === "hydration") return `${value}`;
    return `${value}/5`;
  };

  // Delta vs previous day
  const todayValue = getTodayValue();
  const yesterdayValue = sparkData[sparkData.length - 2] || 0;
  const todayNormalized = todayValue !== null
    ? metricKey === "stress"
      ? 6 - todayValue
      : metricKey === "hydration"
        ? Math.min(todayValue / 8 * 5, 5)
        : todayValue
    : 0;
  const delta = todayNormalized - yesterdayValue;
  const deltaPct = yesterdayValue > 0 ? Math.round((delta / yesterdayValue) * 100) : 0;

  const weeklyAvg = getWeeklyAverage();
  const hasData = todayValue !== null || (weeklyData && weeklyData.length > 0);
  const noSignal = !hasData;
  const statusLed = getStatusColor(todayValue, metricKey);

  // Build sparkline SVG path
  const sparkW = 80;
  const sparkH = 28;
  const max = 5;
  const sparkPath = sparkData
    .map((v, i) => {
      const x = (i / (sparkData.length - 1)) * sparkW;
      const y = sparkH - (v / max) * sparkH;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Area fill path
  const sparkAreaPath = `${sparkPath} L ${sparkW},${sparkH} L 0,${sparkH} Z`;

  // Mini progress ring
  const ringR = 14;
  const ringCirc = 2 * Math.PI * ringR;
  const progressPct = Math.min(weeklyAvg / max, 1);
  const ringOffset = ringCirc - ringCirc * progressPct;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative group"
    >
      <HUDFrame
        className="p-4 transition-all duration-300"
        variant="metric"
        glowColor={colors.glow}
        accentColor={colors.accent}
        active={statusLed === "green"}
      >
        {/* Background gradient tint */}
        <div className={cn("absolute inset-0 rounded-[inherit] pointer-events-none bg-gradient-to-br to-transparent opacity-50", colors.gradFrom)} />

        <div className="relative flex items-center gap-4">
          {/* Left: icon + title + priority */}
          <div className="flex flex-col gap-2 min-w-[100px]">
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-md border border-current/30 bg-current/5", colors.icon)}>
                <Icon className={cn("w-3.5 h-3.5", colors.icon)} />
              </div>
              <span className={cn(
                "text-[8px] font-mono uppercase tracking-[0.2em] px-1.5 py-0.5 rounded border border-current/20 bg-current/5",
                colors.icon
              )}>
                {colors.badge}
              </span>
            </div>
            <h3 className="font-semibold text-foreground text-sm leading-tight">{title}</h3>
            <div className="flex items-center gap-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full", ledColors[statusLed])} />
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70">
                {statusLed === "off" ? "NO_DATA" : statusLed === "green" ? "NOMINAL" : statusLed === "amber" ? "WATCH" : "ALERT"}
              </span>
            </div>
          </div>

          {/* Center: sparkline */}
          <div className="flex-1 flex flex-col items-center min-w-0">
            <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">
              7-DAY TREND
            </div>
            <svg
              width={sparkW}
              height={sparkH}
              viewBox={`0 0 ${sparkW} ${sparkH}`}
              className="w-full max-w-[100px]"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`spark-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.sparkStroke} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={colors.sparkStroke} stopOpacity="0" />
                </linearGradient>
              </defs>
              {sparkData.some((v) => v > 0) && (
                <>
                  <path d={sparkAreaPath} fill={`url(#spark-${metricKey})`} />
                  <path
                    d={sparkPath}
                    fill="none"
                    stroke={colors.sparkStroke}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: `drop-shadow(0 0 3px ${colors.sparkStroke})` }}
                  />
                </>
              )}
              {!sparkData.some((v) => v > 0) && (
                <line
                  x1="0"
                  y1={sparkH / 2}
                  x2={sparkW}
                  y2={sparkH / 2}
                  stroke={colors.sparkStroke}
                  strokeWidth="0.5"
                  strokeDasharray="2 3"
                  opacity="0.3"
                />
              )}
            </svg>
            <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 mt-1 tabular-nums">
              AVG {weeklyAvg.toFixed(1)}/{max}
            </div>
          </div>

          {/* Right: big number + delta + ring */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div
                className={cn(
                  "font-orbitron font-bold text-xl tabular-nums leading-none",
                  colors.icon,
                  noSignal && "animate-hud-flicker opacity-50"
                )}
                style={{ textShadow: hasData ? `0 0 8px ${colors.glow}` : "none" }}
              >
                {getDisplayValue()}
              </div>
              {hasData && Math.abs(delta) > 0.1 && (
                <div
                  className={cn(
                    "text-[9px] font-mono tabular-nums mt-0.5",
                    delta > 0 ? "text-emerald-400" : "text-destructive"
                  )}
                >
                  {delta > 0 ? "▲" : "▼"} {Math.abs(deltaPct)}%
                </div>
              )}
            </div>

            {/* Mini ring */}
            <div className="relative w-9 h-9 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r={ringR} fill="none" stroke="hsl(var(--muted) / 0.3)" strokeWidth="2.5" />
                <circle
                  cx="18"
                  cy="18"
                  r={ringR}
                  fill="none"
                  stroke={colors.glow}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: `drop-shadow(0 0 4px ${colors.glow})` }}
                />
              </svg>
              <span className={cn("absolute inset-0 flex items-center justify-center text-[8px] font-bold font-orbitron", colors.icon)}>
                {Math.round(progressPct * 100)}
              </span>
            </div>
          </div>
        </div>
      </HUDFrame>
    </motion.div>
  );
}
