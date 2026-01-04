import { motion } from "framer-motion";
import { Star, CheckCircle2 } from "lucide-react";
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

  // Glass cyber base color (sous le blur)
  const cardBgBase = "rgba(12, 20, 38, 0.75)";

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
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
          background: cardBgBase,
          padding: "5px",
          backdropFilter: "blur(16px)", // 👈 effet glass
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.15)", // bordure glass
          boxShadow: `
            0 10px 40px rgba(0,0,0,0.35),
            0 0 25px ${withAlpha(difficultyColor, 0.3)}
          `,
        }}
      >
        {/* Difficulty Badge */}
        <Badge
          className="absolute top-1 left-2 z-10 text-[10px] uppercase tracking-wide font-semibold px-3 py-1 overflow-hidden"
          style={{
            borderRadius: "999px",
            color: "white",
            background: getTierBackground(),
            border: `1px solid ${withAlpha(difficultyColor, 0.6)}`,
            backdropFilter: "blur(12px)",
            boxShadow: `0 0 ${8 + intensity * 3}px ${withAlpha(
              difficultyColor,
              0.5,
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
            background: "rgba(5,8,15,0.7)",
            borderColor: "rgba(255,255,255,0.25)",
          }}
        >
          <Star className={`h-3.5 w-3.5 ${goal.is_focus ? "fill-yellow-400 text-yellow-400" : "text-white/80"}`} />
        </button>

        {/* Top Section - Image */}
        <div
          className="relative overflow-hidden flex-shrink-0"
          style={{
            height: "130px",
            width: "100%",
            borderRadius: "16px",
            background: goal.image_url
              ? undefined
              : `linear-gradient(45deg, ${withAlpha(
                  difficultyColor,
                  0.55,
                )} 0%, ${withAlpha(difficultyColor, 0.95)} 100%)`,
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
              {/* Icône placeholder */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 94 94" className="w-12 h-12">
                <path
                  fill="white"
                  d="M38.0481 4.82927C38.0481 2.16214 40.018 0 42.4481 0H51.2391C53.6692 0 55.6391 2.16214 55.6391 4.82927V40.1401C55.6391 48.8912 53.2343 55.6657 48.4248 60.4636C43.6153 65.2277 36.7304 67.6098 27.7701 67.6098C18.8099 67.6098 11.925 65.2953 7.11548 60.6663C2.37183 56.0036 3.8147e-06 49.2967 3.8147e-06 40.5456V4.82927C3.8147e-06 2.16213 1.96995 0 4.4 0H13.2405C15.6705 0 17.6405 2.16214 17.6405 4.82927V39.1265C17.6405 43.7892 18.4805 47.2018 20.1605 49.3642C21.8735 51.5267 24.4759 52.6079 27.9678 52.6079C31.4596 52.6079 34.0127 51.5436 35.6268 49.4149C37.241 47.2863 38.0481 43.8399 38.0481 39.0758V4.82927Z"
                />
                <path
                  fill="white"
                  d="M86.9 61.8682C86.9 64.5353 84.9301 66.6975 82.5 66.6975H73.6595C71.2295 66.6975 69.2595 64.5353 69.2595 61.8682V4.82927C69.2595 2.16214 71.2295 0 73.6595 0H82.5C84.9301 0 86.9 2.16214 86.9 4.82927V61.8682Z"
                />
                <path
                  fill="white"
                  d="M2.86102e-06 83.2195C2.86102e-06 80.5524 1.96995 78.3902 4.4 78.3902H83.6C86.0301 78.3902 88 80.5524 88 83.2195V89.1707C88 91.8379 86.0301 94 83.6 94H4.4C1.96995 94 0 91.8379 0 89.1707L2.86102e-06 83.2195Z"
                />
              </svg>
            </div>
          )}

          {/* Bordures décoratives (on garde, mais intégrées au style glass) */}
          <div
            className="absolute top-0 left-0"
            style={{
              borderBottomRightRadius: "10px",
              height: "30px",
              width: "130px",
              background: "rgba(5,10,25,0.9)",
              transform: "skew(-40deg)",
              boxShadow: `-10px -10px 0 0 rgba(5,10,25,0.9)`,
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
              boxShadow: `-5px -5px 0 2px rgba(5,10,25,0.9)`,
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
              boxShadow: `-5px -5px 0 2px rgba(5,10,25,0.9)`,
            }}
          />
        </div>

        {/* Bottom Section */}
        <div className="mt-3 px-2 pb-2 flex-1 flex flex-col min-h-0">
          {/* Title */}
          <div className="h-10 flex items-start justify-center overflow-hidden">
            <h3
              className="text-center font-bold tracking-widest uppercase line-clamp-2 font-rajdhani leading-tight"
              style={{
                fontSize: "13px",
                color: "#f5f7ff",
                letterSpacing: "1.5px",
              }}
            >
              {goal.name}
            </h3>
          </div>

          {/* Steps + Progress */}
          <div className="mt-4 space-y-2 px-1">
            <div className="flex items-center justify-between text-xs font-rajdhani">
              <span style={{ color: "rgba(200, 225, 255, 0.7)" }}>{isHabitGoal ? "Days" : "Steps"}</span>
              <span
                className="font-bold"
                style={{
                  color: isCompleted ? "rgba(200, 225, 255, 0.6)" : difficultyColor,
                }}
              >
                {completedSteps}/{totalSteps} • {progress.toFixed(0)}%
              </span>
            </div>

            {/* Progress Bar glass-like */}
            <div
              className="h-2 w-full rounded-full overflow-hidden"
              style={{
                background: "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "inset 0 0 4px rgba(0,0,0,0.5)",
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
                        ${withAlpha(difficultyColor, 0.3)},
                        ${difficultyColor},
                        ${withAlpha(difficultyColor, 0.8)}
                      )`,
                  boxShadow: `0 0 ${6 + intensity * 2}px ${withAlpha(difficultyColor, 0.8)}`,
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
