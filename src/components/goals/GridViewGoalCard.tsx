import { Star, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDifficultyColor as getUnifiedDifficultyColor } from "@/lib/utils";

interface Goal {
  id: string;
  name: string;
  difficulty?: string | null;
  image_url?: string | null;
  is_focus?: boolean | null;
  goal_type?: string;
  habit_duration_days?: number | null;
  habit_checks?: boolean[] | null;
  totalStepsCount?: number;
  completedStepsCount?: number;
  status?: string | null;
}

interface GridViewGoalCardProps {
  goal: Goal;
  isCompleted?: boolean;
  customDifficultyName?: string;
  customDifficultyColor?: string;
  onNavigate: (goalId: string) => void;
  onToggleFocus: (goalId: string, currentFocus: boolean, e: React.MouseEvent) => void;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "not_started": return "Not Started";
    case "in_progress": return "In Progress";
    case "fully_completed": return "Completed";
    case "paused": return "Paused";
    case "validated": return "Validated";
    default: return status;
  }
};

// Vivid, premium difficulty colors (more saturated)
const getVividDifficultyColor = (difficulty: string, customColor?: string) => {
  if (difficulty === "custom") return customColor || "hsl(280 70% 55%)";
  
  const colorMap: Record<string, string> = {
    easy: "hsl(142 70% 45%)",
    medium: "hsl(45 90% 50%)",
    hard: "hsl(25 85% 55%)",
    extreme: "hsl(0 75% 55%)",
    impossible: "hsl(280 70% 55%)",
  };

  return colorMap[difficulty] || colorMap.easy;
};

export function GridViewGoalCard({
  goal,
  isCompleted = false,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
  onNavigate,
  onToggleFocus,
}: GridViewGoalCardProps) {
  const difficulty = goal.difficulty || "easy";
  const vividColor = getVividDifficultyColor(difficulty, customDifficultyColor);

  const goalType = goal.goal_type || "standard";
  const isHabitGoal = goalType === "habit";
  const totalSteps = isHabitGoal ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
  const completedSteps = isHabitGoal ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const getDifficultyLabel = (diff: string): string => {
    if (diff === "custom") return customDifficultyName || "Custom";
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  };

  return (
    <div
      className="group cursor-pointer"
      onClick={() => onNavigate(goal.id)}
      style={{
        width: "200px",
        height: "200px",
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Main card container */}
      <div
        className="relative w-full h-full"
        style={{
          borderRadius: "12px",
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border) / 0.5)",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Colored difficulty bar on the left - vivid, expands on hover */}
        <div
          className="absolute left-0 top-0 bottom-0 z-10 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:w-full"
          style={{
            width: "5px",
            background: `linear-gradient(180deg, ${vividColor}, ${vividColor}dd)`,
            borderRadius: "12px 0 0 12px",
            boxShadow: `0 0 12px ${vividColor}60, inset 0 0 8px ${vividColor}30`,
          }}
        />

        {/* Background image with overlay */}
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          {goal.image_url ? (
            <>
              <img 
                src={goal.image_url} 
                alt={goal.name} 
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isCompleted ? "grayscale opacity-60" : ""}`}
              />
              <div 
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--card) / 0.85) 0%, hsl(var(--card) / 0.7) 50%, hsl(var(--card) / 0.6) 100%)",
                }}
              />
            </>
          ) : (
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.95) 100%)`,
              }}
            />
          )}
          {/* Subtle futuristic grid overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(${vividColor}20 1px, transparent 1px),
                linear-gradient(90deg, ${vividColor}20 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        {/* Front content - slides right on hover */}
        <div
          className="absolute inset-0 z-20 flex flex-col p-3 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-[110%] group-hover:opacity-0"
        >
          {/* Top row: badge + star */}
          <div className="flex items-start justify-between">
            <Badge
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5"
              style={{
                background: `${vividColor}20`,
                color: vividColor,
                border: `1px solid ${vividColor}40`,
                boxShadow: `0 0 8px ${vividColor}20`,
              }}
            >
              {getDifficultyLabel(difficulty)}
            </Badge>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFocus(goal.id, goal.is_focus || false, e);
              }}
              className="p-1 rounded-full transition-all hover:scale-110 backdrop-blur-sm"
              style={{
                background: "hsl(var(--card) / 0.8)",
                border: "1px solid hsl(var(--border) / 0.5)",
              }}
            >
              <Star className={`h-3 w-3 ${goal.is_focus ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
            </button>
          </div>

          {/* Goal title - centered */}
          <div className="flex-1 flex items-center justify-center">
            <h3
              className="text-center font-bold leading-tight line-clamp-3"
              style={{
                fontSize: "13px",
                color: "hsl(var(--foreground))",
                textShadow: goal.image_url ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
              }}
            >
              {goal.name}
            </h3>
          </div>

          {/* Bottom accent line */}
          <div 
            className="h-0.5 rounded-full opacity-50"
            style={{ background: `linear-gradient(90deg, ${vividColor}, transparent)` }}
          />
        </div>

        {/* Expanded content - slides in from left (where the bar is) */}
        <div
          className="absolute inset-0 z-30 flex flex-col p-3 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] -translate-x-full opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
          style={{
            background: `linear-gradient(135deg, ${vividColor}f0 0%, ${vividColor}dd 100%)`,
            borderRadius: "12px",
          }}
        >
          {/* Futuristic scan lines overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
              borderRadius: "12px",
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full text-white">
            {/* Header with icon */}
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                {getDifficultyLabel(difficulty)}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-xs leading-tight line-clamp-2 mb-auto">
              {goal.name}
            </h3>

            {/* Stats section */}
            <div className="space-y-2 mt-2">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] opacity-80">Status</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                  {getStatusLabel(goal.status || "not_started")}
                </span>
              </div>

              {/* Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="opacity-80">{isHabitGoal ? "Days" : "Steps"}</span>
                  <span className="font-bold">{completedSteps} / {totalSteps}</span>
                </div>
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${progress}%`,
                      background: "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))",
                      boxShadow: "0 0 8px rgba(255,255,255,0.5)",
                    }}
                  />
                </div>
              </div>

              {/* Completed badge */}
              {isCompleted && (
                <div className="text-center text-[10px] font-bold py-0.5 rounded-full bg-white/25 backdrop-blur-sm">
                  ✓ Completed
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
