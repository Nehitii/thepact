import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayHealth, useWeeklyHealth } from "@/hooks/useHealth";
import { useTranslation } from "react-i18next";
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
    progress: "bg-blue-500",
    led: "bg-blue-400",
  },
  cyan: {
    icon: "text-hud-phosphor",
    glow: "hsl(var(--hud-phosphor))",
    progress: "bg-hud-phosphor",
    led: "bg-hud-phosphor",
  },
  amber: {
    icon: "text-hud-amber",
    glow: "hsl(var(--hud-amber))",
    progress: "bg-hud-amber",
    led: "bg-hud-amber",
  },
  orange: {
    icon: "text-orange-400",
    glow: "hsl(25, 95%, 53%)",
    progress: "bg-orange-500",
    led: "bg-orange-400",
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
  green: "bg-emerald-400 shadow-[0_0_6px_hsl(142,70%,50%)]",
  amber: "bg-hud-amber shadow-[0_0_6px_hsl(43,100%,50%)]",
  red: "bg-destructive shadow-[0_0_6px_hsl(0,85%,60%)]",
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

  const getWeeklyAverage = (): number => {
    if (!weeklyData || weeklyData.length === 0) return 0;
    let values: number[] = [];
    switch (metricKey) {
      case "sleep":
        values = weeklyData.filter(d => d.sleep_quality).map(d => d.sleep_quality!);
        break;
      case "activity":
        values = weeklyData.filter(d => d.activity_level).map(d => d.activity_level!);
        break;
      case "stress":
        values = weeklyData.filter(d => d.stress_level).map(d => 6 - d.stress_level!);
        break;
      case "hydration":
        values = weeklyData.filter(d => d.hydration_glasses).map(d => Math.min(d.hydration_glasses! / 8 * 5, 5));
        break;
      case "nutrition":
        values = weeklyData.filter(d => d.meal_balance).map(d => d.meal_balance!);
        break;
    }
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const getDisplayValue = (): string => {
    const value = getTodayValue();
    if (value === null) return "—";
    if (metricKey === "hydration") return `${value}`;
    return `${value}/5`;
  };

  const getProgressPercentage = (): number => {
    const avg = getWeeklyAverage();
    return (avg / 5) * 100;
  };

  const todayValue = getTodayValue();
  const weeklyAvg = getWeeklyAverage();
  const hasData = todayValue !== null || (weeklyData && weeklyData.length > 0);
  const noSignal = !hasData || getDisplayValue() === "—";
  const statusLed = getStatusColor(todayValue, metricKey);

  // Mini circular gauge
  const gaugeR = 16;
  const gaugeCirc = 2 * Math.PI * gaugeR;
  const gaugeOffset = gaugeCirc - (gaugeCirc * Math.min(getProgressPercentage(), 100)) / 100;

  return (
    <div className="relative group">
      <HUDFrame
        className="p-4 transition-all duration-300 group-hover:shadow-[0_0_40px_hsl(var(--hud-phosphor)/0.15)]"
        glowColor={colors.glow}
        active={statusLed === "green"}
      >
        {/* Status LED */}
        <div className={cn("absolute top-3 right-3 w-2 h-2 rounded-full transition-all", ledColors[statusLed])} />

        {/* Header row: Icon + Title + Value + Gauge */}
        <div className="flex items-center gap-3 mb-3">
          <div className={cn("p-1.5 border border-current/20", colors.icon)}
            style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}
          >
            <Icon className={cn("w-4 h-4", colors.icon)} />
          </div>
          <h3 className="font-semibold text-foreground text-sm flex-1">{title}</h3>
          
          {/* Mini circular gauge */}
          <div className="relative w-10 h-10 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r={gaugeR} fill="none" stroke="hsl(var(--muted) / 0.3)" strokeWidth="3" />
              <circle cx="20" cy="20" r={gaugeR} fill="none" stroke={colors.glow} strokeWidth="3"
                strokeLinecap="round" strokeDasharray={gaugeCirc} strokeDashoffset={gaugeOffset}
                className="transition-all duration-1000 ease-out"
                style={{ filter: `drop-shadow(0 0 3px ${colors.glow})` }}
              />
            </svg>
            <span className={cn(
              "absolute inset-0 flex items-center justify-center text-[10px] font-bold font-orbitron",
              colors.icon,
              noSignal && "animate-hud-flicker opacity-50"
            )}>
              {getDisplayValue()}
            </span>
          </div>
        </div>
        
        {/* Weekly Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider">
            <span className="text-muted-foreground">{t("health.scores.weeklyAverage")}</span>
            <span className={colors.icon}>{weeklyAvg.toFixed(1)}/5</span>
          </div>
          <div className="relative h-1 bg-muted/30 dark:bg-card/50 overflow-hidden">
            {[20, 40, 60, 80].map(pct => (
              <div key={pct} className="absolute top-0 bottom-0 w-[1px] bg-muted-foreground/20" style={{ left: `${pct}%` }} />
            ))}
            <div
              className={cn("h-full transition-all duration-1000 ease-out", colors.progress)}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Hydration unit label */}
        {metricKey === "hydration" && todayValue !== null && (
          <p className="text-[10px] text-muted-foreground/60 font-mono mt-1 text-right">
            {t("health.settings.glasses")}
          </p>
        )}
        
        {!hasData && (
          <p className="text-[10px] text-muted-foreground/50 mt-2 text-center font-mono uppercase tracking-wider animate-hud-flicker">
            {t("health.dailyCheckin")}
          </p>
        )}
      </HUDFrame>
    </div>
  );
}
