import { motion } from "framer-motion";
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

interface UIVerseGoalCardProps {
  goal: Goal;
  isCompleted?: boolean;
  customDifficultyName?: string;
  customDifficultyColor?: string;
  onNavigate: (goalId: string) => void;
  onToggleFocus: (goalId: string, currentFocus: boolean, e: React.MouseEvent) => void;
}

// Get soft, light colors for each difficulty
const getSoftColors = (difficulty: string, customColor: string) => {
  const baseColor = difficulty === "custom" ? customColor : getUnifiedDifficultyColor(difficulty);
  
  // Parse HSL or use fallback
  const parseToHSL = (color: string): { h: number; s: number; l: number } => {
    if (color.startsWith("hsl(")) {
      const match = color.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%/);
      if (match) {
        return { h: parseInt(match[1]), s: parseInt(match[2]), l: parseInt(match[3]) };
      }
    }
    // Fallback based on difficulty
    switch (difficulty) {
      case "easy": return { h: 142, s: 70, l: 45 };
      case "medium": return { h: 48, s: 95, l: 50 };
      case "hard": return { h: 25, s: 95, l: 55 };
      case "extreme": return { h: 0, s: 85, l: 55 };
      case "impossible": return { h: 280, s: 85, l: 55 };
      case "custom": return { h: 270, s: 70, l: 55 };
      default: return { h: 142, s: 70, l: 45 };
    }
  };

  const hsl = parseToHSL(baseColor);
  
  return {
    // Card front background - very light, subtle tint
    frontBg: `hsl(${hsl.h} ${Math.min(hsl.s, 25)}% 96%)`,
    // Gradient for expanded content - soft, readable
    contentGradient: `linear-gradient(135deg, hsl(${hsl.h} ${Math.min(hsl.s, 50)}% 55%) 0%, hsl(${hsl.h} ${Math.min(hsl.s, 60)}% 45%) 100%)`,
    // Bar/strip color - medium saturation
    barColor: `hsl(${hsl.h} ${Math.min(hsl.s, 60)}% 50%)`,
    // Title gradient
    titleGradient: `linear-gradient(135deg, hsl(${hsl.h} ${Math.min(hsl.s, 70)}% 40%) 0%, hsl(${hsl.h} ${Math.min(hsl.s, 80)}% 35%) 100%)`,
    // Badge background
    badgeBg: `hsl(${hsl.h} ${Math.min(hsl.s, 55)}% 50%)`,
    // Original for reference
    baseColor,
  };
};

const getStatusLabel = (status: string | null | undefined): string => {
  switch (status) {
    case "active":
    case "in_progress":
      return "In Progress";
    case "completed":
    case "validated":
    case "fully_completed":
      return "Completed";
    case "paused":
      return "Paused";
    case "cancelled":
      return "Cancelled";
    case "not_started":
      return "Not Started";
    default:
      return "Active";
  }
};

export function UIVerseGoalCard({
  goal,
  isCompleted = false,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
  onNavigate,
  onToggleFocus,
}: UIVerseGoalCardProps) {
  const difficulty = goal.difficulty || "easy";
  const colors = getSoftColors(difficulty, customDifficultyColor);

  const goalType = goal.goal_type || "standard";
  const isHabitGoal = goalType === "habit";
  const totalSteps = isHabitGoal ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
  const completedSteps = isHabitGoal ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;
  const remainingSteps = totalSteps - completedSteps;

  const getDifficultyLabel = (diff: string): string => {
    if (diff === "custom") return customDifficultyName || "Custom";
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  };

  return (
    <motion.div
      whileHover="hovered"
      initial="initial"
      onClick={() => onNavigate(goal.id)}
      className="cursor-pointer"
      style={{ width: "300px", height: "300px" }}
    >
      {/* .card-container */}
      <div
        className="relative overflow-hidden"
        style={{
          width: "300px",
          height: "300px",
          borderRadius: "10px",
          boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* .card */}
        <div
          className="w-full h-full"
          style={{ borderRadius: "inherit" }}
        >
          {/* Focus Star - absolute positioned */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFocus(goal.id, goal.is_focus || false, e);
            }}
            className="absolute top-3 right-3 z-30 p-1.5 rounded-full border transition-all hover:scale-110"
            style={{
              background: "rgba(255,255,255,0.9)",
              borderColor: "rgba(0,0,0,0.1)",
            }}
          >
            <Star className={`h-4 w-4 ${goal.is_focus ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
          </button>

          {/* .front-content */}
          <motion.div
            className="w-full h-full flex flex-col items-center justify-center relative"
            style={{
              background: colors.frontBg,
              borderRadius: "inherit",
            }}
            variants={{
              initial: { x: 0 },
              hovered: { x: "20%" },
            }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Difficulty Badge - centered at top */}
            <Badge
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-xs uppercase tracking-wide font-semibold px-4 py-1.5"
              style={{
                borderRadius: "999px",
                color: "white",
                background: colors.badgeBg,
                boxShadow: `0 2px 8px ${colors.barColor}40`,
              }}
            >
              {getDifficultyLabel(difficulty)}
            </Badge>

            {/* Goal Title - centered */}
            <motion.p
              className="text-2xl font-bold text-center px-6 leading-tight"
              style={{
                background: colors.titleGradient,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                maxWidth: "260px",
              }}
              variants={{
                initial: { opacity: 1 },
                hovered: { opacity: 0 },
              }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              {goal.name}
            </motion.p>
          </motion.div>

          {/* .content - sliding panel */}
          <motion.div
            className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center gap-3 text-white px-6 pointer-events-none"
            style={{
              background: colors.contentGradient,
              borderRadius: "5px",
              lineHeight: 1.5,
            }}
            variants={{
              initial: { x: "96%" },
              hovered: { x: 0 },
            }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Heading - Goal name */}
            <p className="text-2xl font-bold">{goal.name}</p>
            
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-sm">Status:</span>
              <span className="font-semibold text-base">{getStatusLabel(goal.status)}</span>
            </div>

            {/* Remaining steps */}
            <div className="flex flex-col items-center gap-1 mt-2">
              <span className="text-white/80 text-sm">{isHabitGoal ? "Days" : "Steps"}</span>
              <span className="text-xl font-bold">
                {remainingSteps > 0 
                  ? `${remainingSteps} remaining`
                  : "All done!"
                }
              </span>
              <span className="text-white/70 text-sm">
                {completedSteps} / {totalSteps} completed
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
