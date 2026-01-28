import { motion } from "framer-motion";
import { Star, CheckCircle2, Target, Zap } from "lucide-react";
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

const getDifficultyIntensity = (difficulty: string): number => {
  switch (difficulty) {
    case "easy":
      return 1;
    case "medium":
      return 2;
    case "hard":
      return 3;
    case "extreme":
      return 4;
    case "impossible":
    case "custom":
      return 5;
    default:
      return 1;
  }
};

const withAlpha = (color: string, alpha: number): string => {
  if (color.startsWith("hsl(")) {
    const inner = color.slice(4, -1).trim();
    const base = inner.split("/")[0].trim();
    return `hsl(${base} / ${alpha})`;
  }
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    if (full.length === 6) {
      const r = parseInt(full.slice(0, 2), 16);
      const g = parseInt(full.slice(2, 4), 16);
      const b = parseInt(full.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return color;
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
  const difficultyColor = difficulty === "custom" ? customDifficultyColor : getUnifiedDifficultyColor(difficulty);

  const goalType = goal.goal_type || "standard";
  const isHabitGoal = goalType === "habit";
  const totalSteps = isHabitGoal ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
  const completedSteps = isHabitGoal ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const intensity = getDifficultyIntensity(difficulty);

  const getDifficultyLabel = (diff: string): string => {
    if (diff === "custom") return customDifficultyName || "Custom";
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  };

  const getTierBackground = () => {
    switch (difficulty) {
      case "easy":
        return `linear-gradient(135deg, ${withAlpha(difficultyColor, 0.9)}, ${withAlpha(difficultyColor, 0.7)})`;
      case "medium":
        return `linear-gradient(135deg, ${withAlpha(difficultyColor, 0.95)}, ${withAlpha(difficultyColor, 0.75)})`;
      case "hard":
        return `linear-gradient(135deg, ${difficultyColor}, ${withAlpha(difficultyColor, 0.8)})`;
      case "extreme":
        return `linear-gradient(135deg, ${difficultyColor}, ${withAlpha(difficultyColor, 0.6)}, ${difficultyColor})`;
      case "impossible":
      case "custom":
        return `linear-gradient(135deg, ${difficultyColor}, ${withAlpha(difficultyColor, 0.7)}, ${difficultyColor})`;
      default:
        return difficultyColor;
    }
  };

  const getGlossIntensity = (): number => {
    switch (difficulty) {
      case "easy":
        return 0.08;
      case "medium":
        return 0.14;
      case "hard":
        return 0.22;
      case "extreme":
        return 0.28;
      case "impossible":
        return 0.32;
      case "custom":
        return 0.35;
      default:
        return 0.08;
    }
  };

  const glossIntensity = getGlossIntensity();

  // Gamer contrast: fond très sombre + léger gradient
  const cardBgColor = "#050814";
  const tintedBg = `linear-gradient(
    180deg,
    #070b16 0%,
    #050814 40%,
    #040612 100%
  )`;

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      transition={{ duration: 0.25, type: "spring", stiffness: 320 }}
      onClick={() => onNavigate(goal.id)}
      className="cursor-pointer"
      style={{ width: "210px", height: "280px" }}
    >
      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          width: "210px",
          height: "280px",
          borderRadius: "22px",
          background: tintedBg,
          padding: "5px",
          boxShadow: `
            0 18px 45px rgba(0,0,0,0.85),
            0 0 25px ${withAlpha(difficultyColor, 0.35)}
          `,
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* Difficulty Badge */}
        <Badge
          className="absolute top-1 left-2 z-10 text-[10px] uppercase tracking-wide font-semibold px-3 py-1 overflow-hidden"
          style={{
            borderRadius: "999px",
            color: "white",
            background: getTierBackground(),
            border: `1px solid ${withAlpha(difficultyColor, 0.7)}`,
            boxShadow: `0 0 ${8 + intensity * 3}px ${withAlpha(
              difficultyColor,
              0.7,
            )}, inset 0 1px 1px rgba(255,255,255,${glossIntensity})`,
          }}
        >
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,${glossIntensity * 1.2}) 0%, rgba(255,255,255,${
                glossIntensity * 0.3
              }) 40%, transparent 60%)`,
              borderRadius: "inherit",
            }}
          />
          <span className="relative z-10">{getDifficultyLabel(difficulty)}</span>
        </Badge>

        {/* Focus Star */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFocus(goal.id, goal.is_focus || false, e);
          }}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full border transition-all hover:scale-110"
          style={{
            background: "rgba(6,10,22,0.9)",
            borderColor: "rgba(255,255,255,0.25)",
          }}
        >
          <Star className={`h-3.5 w-3.5 ${goal.is_focus ? "fill-yellow-400 text-yellow-400" : "text-white/80"}`} />
        </button>

        {/* Top Section - Image / Header */}
        <div
          className="relative overflow-hidden flex-shrink-0"
          style={{
            height: "130px",
            width: "100%",
            borderRadius: "16px",
            background: goal.image_url
              ? undefined
              : `linear-gradient(45deg, ${withAlpha(difficultyColor, 0.7)} 0%, ${difficultyColor} 40%, ${withAlpha(
                  difficultyColor,
                  0.4,
                )} 100%)`,
          }}
        >
          {goal.image_url ? (
            <img
              src={goal.image_url}
              alt={goal.name}
              className={`absolute inset-0 w-full h-full object-cover ${isCompleted ? "grayscale opacity-70" : ""}`}
              style={{ borderRadius: "16px" }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Neutral placeholder icon - Target for standard, Zap for habits */}
              {isHabitGoal ? (
                <Zap className="w-12 h-12 text-white/90 drop-shadow-lg" />
              ) : (
                <Target className="w-12 h-12 text-white/90 drop-shadow-lg" />
              )}
            </div>
          )}

          {/* petits accents de découpe comme avant, mais foncés */}
          <div
            className="absolute top-0 left-0"
            style={{
              borderBottomRightRadius: "10px",
              height: "30px",
              width: "130px",
              background: "#050814",
              transform: "skew(-40deg)",
              boxShadow: `-10px -10px 0 0 #050814`,
            }}
          />
          <div
            className="absolute"
            style={{
              top: "0",
              right: "115px",
              width: "15px",
              height: "15px",
              background: "transparent",
              borderTopLeftRadius: "10px",
              boxShadow: `-5px -5px 0 2px #050814`,
            }}
          />
          <div
            className="absolute"
            style={{
              top: "30px",
              left: "0",
              width: "15px",
              height: "15px",
              background: "transparent",
              borderTopLeftRadius: "15px",
              boxShadow: `-5px -5px 0 2px #050814`,
            }}
          />
        </div>

        {/* Séparateur lumineux entre header et contenu */}
        <div
          style={{
            marginTop: "8px",
            marginBottom: "6px",
            width: "100%",
            height: "2px",
            borderRadius: "999px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
            opacity: 0.9,
          }}
        />

        {/* Bottom Section */}
        <div className="px-2 pb-2 flex-1 flex flex-col min-h-0">
          {/* Title */}
          <div className="h-10 flex items-start justify-center overflow-hidden">
            <h3
              className="text-center font-bold tracking-widest uppercase line-clamp-2 font-rajdhani leading-tight"
              style={{
                fontSize: "13px",
                color: "#ffffff",
                letterSpacing: "1.6px",
              }}
            >
              {goal.name}
            </h3>
          </div>

          {/* Steps + Progress */}
          <div className="mt-3 space-y-2 px-1">
            <div className="flex items-center justify-between text-xs font-rajdhani">
              <span style={{ color: "#7f8ca9" }}>{isHabitGoal ? "Days" : "Steps"}</span>
              <span
                className="font-bold"
                style={{
                  color: isCompleted ? "#9caad4" : difficultyColor,
                }}
              >
                {completedSteps}/{totalSteps} • {progress.toFixed(0)}%
              </span>
            </div>

            {/* Progress Bar – gamer style */}
            <div
              className="h-2 w-full rounded-full overflow-hidden"
              style={{
                background: "#141827",
                border: "1px solid rgba(255,255,255,0.05)",
                boxShadow: "inset 0 0 4px rgba(0,0,0,0.6)",
              }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                  background: isCompleted
                    ? "linear-gradient(90deg, #4ade80, #22c55e)"
                    : `linear-gradient(
                        90deg,
                        ${withAlpha(difficultyColor, 0.2)},
                        ${difficultyColor},
                        ${withAlpha(difficultyColor, 0.9)}
                      )`,
                  boxShadow: `0 0 ${7 + intensity * 2}px ${withAlpha(difficultyColor, 0.85)}`,
                }}
              />
            </div>

            {isCompleted && (
              <div className="flex items-center justify-center gap-1 text-emerald-300 text-xs font-rajdhani mt-2">
                <CheckCircle2 className="h-3 w-3" />
                <span>Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
