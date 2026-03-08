import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check } from "lucide-react";
import { motion } from "framer-motion";
import { HabitHeatmap } from "@/components/habits/HabitHeatmap";
import type { GoalDetailData } from "@/hooks/useGoalDetail";

interface GoalDetailHabitProps {
  goal: GoalDetailData;
  completedStepsCount: number;
  difficultyColor: string;
  onToggleHabitCheck: (dayIndex: number) => void;
}

export const GoalDetailHabit = React.memo(function GoalDetailHabit({
  goal, completedStepsCount, difficultyColor, onToggleHabitCheck,
}: GoalDetailHabitProps) {
  const heatmapData = React.useMemo(() => {
    const data = new Map<string, { count: number; completed: boolean }>();
    goal.habit_checks?.forEach((checked, i) => {
      if (goal.created_at) {
        const d = new Date(goal.created_at);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split("T")[0];
        if (checked) data.set(key, { count: 1, completed: true });
      }
    });
    return data;
  }, [goal.habit_checks, goal.created_at]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="relative rounded-xl border border-border bg-card/80 backdrop-blur-xl">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-5 w-5" style={{ color: difficultyColor }} />
            <span className="font-orbitron font-bold tracking-wider">Habit Tracking</span>
            <Badge variant="outline" className="ml-auto font-rajdhani text-sm" style={{ borderColor: difficultyColor, color: difficultyColor }}>
              {completedStepsCount}/{goal.habit_duration_days} days
            </Badge>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {goal.habit_checks?.map((checked, index) => (
              <div
                key={index}
                onClick={() => onToggleHabitCheck(index)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${checked ? "border-primary/60 bg-primary/10" : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50"}`}
                style={{ boxShadow: checked ? `0 0 20px ${difficultyColor}30` : undefined }}
              >
                <span className="text-xs text-muted-foreground mb-1 font-rajdhani uppercase">Day</span>
                <span className={`text-lg font-bold font-orbitron ${checked ? "" : "text-muted-foreground"}`} style={{ color: checked ? difficultyColor : undefined }}>
                  {index + 1}
                </span>
                {checked && <Check className="absolute top-1 right-1 h-3 w-3" style={{ color: difficultyColor }} />}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center font-rajdhani">Tap a day to mark it as complete</p>
          <div className="mt-6 pt-6 border-t border-border">
            <HabitHeatmap data={heatmapData} />
          </div>
        </div>
      </div>
    </motion.div>
  );
});
