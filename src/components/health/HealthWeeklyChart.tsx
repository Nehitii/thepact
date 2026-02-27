import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useWeeklyHealth, useHealthSettings } from "@/hooks/useHealth";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HUDFrame } from "./HUDFrame";

export function HealthWeeklyChart() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: weeklyData = [], isLoading } = useWeeklyHealth(user?.id);
  const { data: settings } = useHealthSettings(user?.id);

  const daysShortRaw = t("common.daysShort", { returnObjects: true }) as string[];
  const dayLabels = [daysShortRaw[1], daysShortRaw[2], daysShortRaw[3], daysShortRaw[4], daysShortRaw[5], daysShortRaw[6], daysShortRaw[0]];

  if (isLoading) {
    return (
      <HUDFrame className="p-6" variant="chart">
        <div className="h-6 bg-muted/30 rounded w-1/4 mb-6 animate-pulse" />
        <div className="h-40 bg-muted/30 rounded animate-pulse" />
      </HUDFrame>
    );
  }

  const dataByDate = new Map(weeklyData.map(d => [d.entry_date, d]));

  const getDayData = (dayIndex: number) => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + dayIndex);
    const dateStr = format(targetDate, "yyyy-MM-dd");
    return { date: dateStr, data: dataByDate.get(dateStr) || null, isToday: dateStr === format(new Date(), "yyyy-MM-dd") };
  };

  const getBarHeight = (value: number | null, max: number = 5) => {
    if (value === null) return 0;
    return (value / max) * 100;
  };

  return (
    <HUDFrame className="p-6" variant="chart" scanLine>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-hud-phosphor" />
          {t("health.weeklyChart")}
        </h3>
        <div className="flex gap-4 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-blue-500" /> {t("health.metrics.sleep")}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-hud-phosphor" /> {t("health.metrics.activity")}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-hud-amber" /> {t("health.metrics.stress")}
          </span>
        </div>
      </div>

      <div className="flex gap-4 relative">
        {/* Target zone band */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 right-0 rounded-lg" style={{
            bottom: '60%', height: '40%',
            background: 'linear-gradient(180deg, hsl(var(--hud-phosphor) / 0.06), hsl(var(--hud-phosphor) / 0.02))',
            borderTop: '1px dashed hsl(var(--hud-phosphor) / 0.15)',
          }} />
        </div>

        {dayLabels.map((day, i) => {
          const { data, isToday } = getDayData(i);
          return (
            <div key={day} className={cn("flex-1 text-center relative z-10", isToday && "relative")}>
              {isToday && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-hud-phosphor" />
              )}
              <div className="flex gap-1 justify-center h-32 items-end mb-2">
                <motion.div className="w-3 bg-blue-500/90 rounded-t-sm"
                  initial={{ height: 0 }} animate={{ height: `${getBarHeight(data?.sleep_quality)}%` }}
                  transition={{ delay: 0.1 * i, duration: 0.5 }} />
                <motion.div className="w-3 bg-hud-phosphor/90 rounded-t-sm"
                  initial={{ height: 0 }} animate={{ height: `${getBarHeight(data?.activity_level)}%` }}
                  transition={{ delay: 0.1 * i + 0.05, duration: 0.5 }} />
                <motion.div className="w-3 bg-hud-amber/90 rounded-t-sm"
                  initial={{ height: 0 }} animate={{ height: `${getBarHeight(data?.stress_level ? 6 - data.stress_level : null)}%` }}
                  transition={{ delay: 0.1 * i + 0.1, duration: 0.5 }} />
              </div>
              <span className={cn(
                "text-xs font-mono uppercase tracking-wider",
                isToday ? "text-hud-phosphor font-medium" : "text-muted-foreground"
              )}>
                {day}
              </span>
              {!data && <div className="text-[10px] text-muted-foreground/50 mt-1 font-mono">—</div>}
            </div>
          );
        })}
      </div>

      {weeklyData.length === 0 && (
        <div className="text-center text-muted-foreground/70 text-sm mt-4 font-mono">{t("health.dailyCheckin")}</div>
      )}
    </HUDFrame>
  );
}
