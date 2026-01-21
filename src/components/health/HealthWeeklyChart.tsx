import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useWeeklyHealth, useHealthSettings } from "@/hooks/useHealth";
import { cn } from "@/lib/utils";
import { 
  Moon, 
  Activity, 
  Brain,
  TrendingUp,
} from "lucide-react";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function HealthWeeklyChart() {
  const { user } = useAuth();
  const { data: weeklyData = [], isLoading } = useWeeklyHealth(user?.id);
  const { data: settings } = useHealthSettings(user?.id);

  if (isLoading) {
    return (
      <div className="bg-card/30 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-1/4 mb-6" />
        <div className="h-40 bg-muted/30 rounded" />
      </div>
    );
  }

  // Create a map of date -> data
  const dataByDate = new Map(weeklyData.map(d => [d.entry_date, d]));

  // Generate array for all 7 days
  const getDayData = (dayIndex: number) => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + dayIndex);
    const dateStr = format(targetDate, "yyyy-MM-dd");
    
    return {
      date: dateStr,
      data: dataByDate.get(dateStr) || null,
      isToday: dateStr === format(new Date(), "yyyy-MM-dd"),
    };
  };

  const getBarHeight = (value: number | null, max: number = 5) => {
    if (value === null) return 0;
    return (value / max) * 100;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card/30 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Weekly Overview
        </h3>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" /> Sleep
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500" /> Activity
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500" /> Stress
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex gap-4">
        {dayLabels.map((day, i) => {
          const { data, isToday } = getDayData(i);
          
          return (
            <div 
              key={day} 
              className={cn(
                "flex-1 text-center",
                isToday && "relative"
              )}
            >
              {isToday && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400" />
              )}
              
              {/* Bars container */}
              <div className="flex gap-1 justify-center h-32 items-end mb-2">
                {/* Sleep bar */}
                <motion.div
                  className="w-3 rounded-t bg-blue-500/80"
                  initial={{ height: 0 }}
                  animate={{ height: `${getBarHeight(data?.sleep_quality)}%` }}
                  transition={{ delay: 0.1 * i, duration: 0.5 }}
                />
                
                {/* Activity bar */}
                <motion.div
                  className="w-3 rounded-t bg-emerald-500/80"
                  initial={{ height: 0 }}
                  animate={{ height: `${getBarHeight(data?.activity_level)}%` }}
                  transition={{ delay: 0.1 * i + 0.05, duration: 0.5 }}
                />
                
                {/* Stress bar (inverted - lower is better) */}
                <motion.div
                  className="w-3 rounded-t bg-purple-500/80"
                  initial={{ height: 0 }}
                  animate={{ height: `${getBarHeight(data?.stress_level ? 6 - data.stress_level : null)}%` }}
                  transition={{ delay: 0.1 * i + 0.1, duration: 0.5 }}
                />
              </div>
              
              {/* Day label */}
              <span className={cn(
                "text-xs",
                isToday ? "text-emerald-400 font-medium" : "text-muted-foreground"
              )}>
                {day}
              </span>
              
              {/* No data indicator */}
              {!data && (
                <div className="text-[10px] text-muted-foreground/50 mt-1">—</div>
              )}
            </div>
          );
        })}
      </div>

      {weeklyData.length === 0 && (
        <div className="text-center text-muted-foreground/70 text-sm mt-4">
          Complete daily check-ins to see your weekly trends
        </div>
      )}
    </motion.div>
  );
}
