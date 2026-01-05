import { Star } from "lucide-react";
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

// Soft, light difficulty colors
const getSoftDifficultyColors = (difficulty: string, customColor?: string) => {
  const baseColor = difficulty === "custom" ? customColor : getUnifiedDifficultyColor(difficulty);
  
  // Extract HSL values and create lighter versions
  const colorMap: Record<string, { main: string; expanded: string; bar: string; text: string; border: string }> = {
    easy: {
      main: "hsl(142 45% 92%)",
      expanded: "hsl(142 50% 96%)",
      bar: "hsl(142 60% 50%)",
      text: "hsl(142 50% 25%)",
      border: "hsl(142 40% 80%)"
    },
    medium: {
      main: "hsl(48 55% 92%)",
      expanded: "hsl(48 60% 96%)",
      bar: "hsl(48 80% 50%)",
      text: "hsl(48 60% 25%)",
      border: "hsl(48 50% 80%)"
    },
    hard: {
      main: "hsl(25 55% 92%)",
      expanded: "hsl(25 60% 96%)",
      bar: "hsl(25 80% 55%)",
      text: "hsl(25 60% 30%)",
      border: "hsl(25 45% 80%)"
    },
    extreme: {
      main: "hsl(0 55% 93%)",
      expanded: "hsl(0 60% 97%)",
      bar: "hsl(0 70% 55%)",
      text: "hsl(0 50% 30%)",
      border: "hsl(0 40% 82%)"
    },
    impossible: {
      main: "hsl(280 45% 93%)",
      expanded: "hsl(280 50% 97%)",
      bar: "hsl(280 60% 55%)",
      text: "hsl(280 45% 30%)",
      border: "hsl(280 35% 82%)"
    },
    custom: {
      main: "hsl(280 45% 93%)",
      expanded: "hsl(280 50% 97%)",
      bar: baseColor || "hsl(280 60% 55%)",
      text: "hsl(280 45% 30%)",
      border: "hsl(280 35% 82%)"
    }
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
  const colors = getSoftDifficultyColors(difficulty, customDifficultyColor);
  const difficultyColor = difficulty === "custom" ? customDifficultyColor : getUnifiedDifficultyColor(difficulty);

  const goalType = goal.goal_type || "standard";
  const isHabitGoal = goalType === "habit";
  const totalSteps = isHabitGoal ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
  const completedSteps = isHabitGoal ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;

  const getDifficultyLabel = (diff: string): string => {
    if (diff === "custom") return customDifficultyName || "Custom";
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  };

  return (
    <div
      className="card-container group cursor-pointer"
      onClick={() => onNavigate(goal.id)}
      style={{
        width: "280px",
        height: "280px",
        position: "relative",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        overflow: "hidden",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "inherit",
          background: colors.main,
          border: `1px solid ${colors.border}`,
        }}
      >
        {/* Left bar indicator (when closed) */}
        <div
          className="absolute left-0 top-0 bottom-0 transition-opacity duration-300 group-hover:opacity-0"
          style={{
            width: "4px",
            background: colors.bar,
            borderRadius: "16px 0 0 16px",
          }}
        />

        {/* Front content */}
        <div
          className="front-content absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-[20%] group-hover:opacity-0"
        >
          {/* Difficulty Badge - centered at top */}
          <Badge
            className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1"
            style={{
              background: colors.bar,
              color: "white",
              border: "none",
              boxShadow: `0 2px 8px ${colors.bar}40`,
            }}
          >
            {getDifficultyLabel(difficulty)}
          </Badge>

          {/* Focus Star */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFocus(goal.id, goal.is_focus || false, e);
            }}
            className="absolute top-4 right-4 z-20 p-1.5 rounded-full transition-all hover:scale-110"
            style={{
              background: "rgba(255,255,255,0.9)",
              border: `1px solid ${colors.border}`,
            }}
          >
            <Star className={`h-4 w-4 ${goal.is_focus ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
          </button>

          {/* Goal title */}
          <h3
            className="text-center font-bold leading-tight line-clamp-3 mt-8"
            style={{
              fontSize: "20px",
              color: colors.text,
              maxWidth: "90%",
            }}
          >
            {goal.name}
          </h3>
        </div>

        {/* Expanded content (slides in on hover) */}
        <div
          className="content absolute inset-0 flex flex-col items-center justify-center text-center gap-4 p-6 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] translate-x-[100%] group-hover:translate-x-0"
          style={{
            background: colors.expanded,
            borderRadius: "12px",
            border: `1px solid ${colors.border}`,
          }}
        >
          {/* Difficulty Badge in expanded view */}
          <Badge
            className="text-xs font-semibold px-3 py-1"
            style={{
              background: colors.bar,
              color: "white",
              border: "none",
            }}
          >
            {getDifficultyLabel(difficulty)}
          </Badge>

          {/* Goal title */}
          <h3
            className="font-bold leading-tight line-clamp-2"
            style={{
              fontSize: "18px",
              color: colors.text,
            }}
          >
            {goal.name}
          </h3>

          {/* Status */}
          <div
            className="text-sm font-medium px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.8)",
              color: colors.text,
              border: `1px solid ${colors.border}`,
            }}
          >
            {getStatusLabel(goal.status || "not_started")}
          </div>

          {/* Steps remaining */}
          <div
            className="text-sm"
            style={{ color: colors.text }}
          >
            <span className="font-semibold">{completedSteps}</span>
            <span className="opacity-70"> / {totalSteps} </span>
            <span className="opacity-70">{isHabitGoal ? "days" : "steps"}</span>
          </div>

          {/* Completed indicator */}
          {isCompleted && (
            <div
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{
                background: "hsl(142 60% 50%)",
                color: "white",
              }}
            >
              ✓ Completed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
