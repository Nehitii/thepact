import React, { useMemo } from "react";
import { Star, Target, Zap, ImageOff, CheckCircle } from "lucide-react";
import { getTagColor, getTagLabel, getStatusLabel, getDifficultyIntensity } from "@/lib/goalConstants";
import { cn } from "@/lib/utils";

// --- Interfaces ---
interface Goal {
  id: string;
  name: string;
  type?: string;
  difficulty?: string | null;
  image_url?: string | null;
  is_focus?: boolean | null;
  goal_type?: string;
  habit_duration_days?: number | null;
  habit_checks?: boolean[] | null;
  totalStepsCount?: number;
  completedStepsCount?: number;
  status?: string | null;
  tags?: string[];
}

interface GridViewGoalCardProps {
  goal: Goal;
  isCompleted?: boolean;
  customDifficultyName?: string;
  customDifficultyColor?: string;
  onNavigate: (goalId: string) => void;
  onToggleFocus: (goalId: string, currentFocus: boolean, e: React.MouseEvent) => void;
}

// --- Helpers ---
const getDifficultyTheme = (difficulty: string, customColor?: string) => {
  switch (difficulty) {
    case "easy":
      return { color: "#4ade80", rgb: "74, 222, 128" };
    case "medium":
      return { color: "#facc15", rgb: "250, 204, 21" };
    case "hard":
      return { color: "#fb923c", rgb: "251, 146, 60" };
    case "extreme":
      return { color: "#f87171", rgb: "248, 113, 113" };
    case "impossible":
      return { color: "#c084fc", rgb: "192, 132, 252" };
    case "custom": {
      const base = customColor || "#a855f7";
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(base);
      const rgb = result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : "168, 85, 247";
      return { color: base, rgb };
    }
    default:
      return { color: "#94a3b8", rgb: "148, 163, 184" };
  }
};

const getDifficultyLabel = (diff: string, customName?: string): string => {
  if (diff === "custom") return customName || "Custom";
  return diff.charAt(0).toUpperCase() + diff.slice(1);
};

export function GridViewGoalCard({
  goal,
  isCompleted = false,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
  onNavigate,
  onToggleFocus,
}: GridViewGoalCardProps) {
  const derived = useMemo(() => {
    const diff = goal.difficulty || "easy";
    const goalType = goal.goal_type || "standard";
    const isHabit = goalType === "habit";

    const total = isHabit ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
    const completed = isHabit ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;
    const prog = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

    return {
      difficulty: diff,
      isHabitGoal: isHabit,
      totalSteps: total,
      completedSteps: completed,
      progress: prog,
      theme: getDifficultyTheme(diff, customDifficultyColor),
      statusLabel: isCompleted ? "Completed" : getStatusLabel(goal.status || "not_started"),
      displayTags: goal.tags?.slice(0, 2) || (goal.type ? [goal.type] : []),
      remainingTagsCount: Math.max(0, (goal.tags?.length || 0) - 2),
    };
  }, [goal, isCompleted, customDifficultyColor]);

  const { difficulty, isHabitGoal, totalSteps, completedSteps, progress, theme, statusLabel, displayTags, remainingTagsCount } = derived;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onNavigate(goal.id);
    }
  };

  const cssVars = {
    "--accent": theme.color,
    "--accent-rgb": theme.rgb,
    "--progress": `${progress}%`,
  } as React.CSSProperties;

  return (
    <article
      style={cssVars}
      onClick={() => onNavigate(goal.id)}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative w-full max-w-[340px] min-w-[260px] mx-auto cursor-pointer select-none rounded-[20px]",
        "transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "hover:-translate-y-1 hover:z-20 active:scale-[0.98]",
        "[perspective:1000px]",
        isCompleted && "grayscale-[0.4] hover:grayscale-0",
      )}
      // Maintain aspect ratio via padding trick for broad compat
    >
      {/* Card Inner */}
      <div
        className={cn(
          "relative w-full rounded-[20px] overflow-hidden",
          "bg-[#09090b] border border-white/[0.08]",
          "shadow-sm transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
          "group-hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.6),0_0_0_1px_rgba(var(--accent-rgb),0.3)]",
          "group-hover:border-[rgba(var(--accent-rgb),0.3)]",
        )}
        style={{ aspectRatio: "4/5" }}
      >
        {/* Image Layer */}
        <div className="absolute inset-0 z-0">
          {goal.image_url ? (
            <img
              src={goal.image_url}
              alt={goal.name}
              loading="lazy"
              className="w-full h-full object-cover opacity-80 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
            />
          ) : (
            <div className="w-full h-full bg-[radial-gradient(circle_at_center,#1f2937,#111827)] flex items-center justify-center text-[#374151]">
              <ImageOff size={48} strokeWidth={1} opacity={0.3} />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/10 via-black/20 to-black/90" />
        </div>

        {/* Shine Effect */}
        <div className="absolute inset-0 z-[2] pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-[shimmer_1s_forwards]" />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-3.5 flex justify-between items-start z-10">
          {/* Difficulty Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 backdrop-blur-lg border border-white/10 rounded-full text-[10px] font-bold tracking-wider text-gray-100 uppercase">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }}
            />
            {getDifficultyLabel(difficulty, customDifficultyName)}
          </div>

          {/* Focus Button */}
          <button
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border",
              "backdrop-blur-sm cursor-pointer",
              goal.is_focus
                ? "bg-[rgba(var(--accent-rgb),0.2)] border-[var(--accent)] text-[var(--accent)] shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]"
                : "bg-black/40 border-white/10 text-white/60 hover:bg-white/20 hover:scale-110 hover:text-white",
            )}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFocus(goal.id, !!goal.is_focus, e);
            }}
            aria-label={goal.is_focus ? "Remove from focus" : "Set as focus"}
          >
            <Star className="w-4 h-4" fill={goal.is_focus ? "currentColor" : "none"} strokeWidth={goal.is_focus ? 0 : 2} />
          </button>
        </div>

        {/* Glass Panel Content */}
        <div
          className={cn(
            "absolute bottom-3 left-3 right-3 p-4 rounded-2xl z-10",
            "bg-[rgba(20,20,25,0.75)] backdrop-blur-xl border border-white/[0.08]",
            "shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
            "flex flex-col gap-3 transition-all duration-300",
            "group-hover:bg-[rgba(20,20,25,0.85)] group-hover:border-white/[0.15]",
          )}
        >
          {/* Header Row */}
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[var(--accent)] drop-shadow-[0_0_4px_rgba(var(--accent-rgb),0.4)]">
              {isCompleted ? <CheckCircle size={14} /> : isHabitGoal ? <Zap size={14} /> : <Target size={14} />}
            </span>
            <div className="flex gap-1">
              {displayTags.map((tag, i) => (
                <span
                  key={i}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border bg-black/40 uppercase"
                  style={{ borderColor: getTagColor(tag), color: getTagColor(tag) }}
                >
                  {getTagLabel(tag)}
                </span>
              ))}
              {remainingTagsCount > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-dashed border-gray-600 text-gray-400 bg-black/40 uppercase">
                  +{remainingTagsCount}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold leading-tight text-white line-clamp-2 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
            {goal.name}
          </h3>

          {/* Progress */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] font-semibold">
              <span className={cn("uppercase tracking-wider", isCompleted ? "text-[var(--accent)]" : "text-gray-400")}>
                {statusLabel}
              </span>
              <span className="text-gray-100 tabular-nums">{progress}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                style={{
                  width: `${progress}%`,
                  background: "var(--accent)",
                  boxShadow: "0 0 8px var(--accent)",
                }}
              />
            </div>
            <div className="flex justify-end">
              <span className="text-[10px] text-gray-500">
                {completedSteps} / {totalSteps} {isHabitGoal ? "days" : "steps"}
              </span>
            </div>
          </div>
        </div>

        {/* Border Glow */}
        <div
          className={cn(
            "absolute inset-0 rounded-[20px] border border-transparent pointer-events-none z-20",
            "transition-all duration-300",
            "group-hover:border-[rgba(var(--accent-rgb),0.4)] group-hover:shadow-[inset_0_0_20px_rgba(var(--accent-rgb),0.05)]",
          )}
        />
      </div>
    </article>
  );
}

export default GridViewGoalCard;
