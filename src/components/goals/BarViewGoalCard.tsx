import React, { memo, useMemo } from "react";
import { Star, Target, Trophy, TrendingUp } from "lucide-react";
import { DIFFICULTY_OPTIONS, getStatusLabel, getDifficultyIntensity } from "@/lib/goalConstants";

interface Goal {
  id: string;
  name: string;
  type: string;
  difficulty?: string | null;
  status?: string | null;
  image_url?: string | null;
  is_focus?: boolean | null;
  goal_type?: string;
  habit_duration_days?: number | null;
  habit_checks?: boolean[] | null;
  totalStepsCount?: number;
  completedStepsCount?: number;
  potential_score?: number | null;
  tags?: string[];
  deadline?: string | null;
}

interface BarViewGoalCardProps {
  goal: Goal;
  isCompleted?: boolean;
  customDifficultyName?: string;
  customDifficultyColor?: string;
  onNavigate: (goalId: string) => void;
  onToggleFocus: (goalId: string, currentFocus: boolean, e: React.MouseEvent) => void;
}

const getDifficultyTheme = (difficulty: string, customColor?: string) => {
  switch (difficulty) {
    case "easy": return { color: "#22c55e", rgb: "34, 197, 94" };
    case "medium": return { color: "#fbbf24", rgb: "251, 191, 36" };
    case "hard": return { color: "#f97316", rgb: "249, 115, 22" };
    case "extreme": return { color: "#ef4444", rgb: "239, 68, 68" };
    case "impossible": return { color: "#d946ef", rgb: "217, 70, 239" };
    case "custom": {
      const base = customColor || "#a855f7";
      const hex = base.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) || 168;
      const g = parseInt(hex.substring(2, 4), 16) || 85;
      const b = parseInt(hex.substring(4, 6), 16) || 247;
      return { color: base, rgb: `${r}, ${g}, ${b}` };
    }
    default: return { color: "#94a3b8", rgb: "148, 163, 184" };
  }
};

const getDifficultyDisplayLabel = (difficulty: string, customName: string): string => {
  if (difficulty === "custom") return customName || "Custom";
  const found = DIFFICULTY_OPTIONS.find((d) => d.value === difficulty);
  return found?.value
    ? found.value.charAt(0).toUpperCase() + found.value.slice(1)
    : difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

export const BarViewGoalCard = memo(function BarViewGoalCard({
  goal,
  isCompleted = false,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
  onNavigate,
  onToggleFocus,
}: BarViewGoalCardProps) {
  const { theme, difficultyLabel, progressPercent, statusLabel, totalSteps, completedSteps, intensity, deadlineInfo } =
    useMemo(() => {
      const diff = goal.difficulty || "easy";
      const total = goal.totalStepsCount || 0;
      const completed = goal.completedStepsCount || 0;
      let deadlineInfo: { daysLeft: number; color: string } | null = null;
      if (goal.deadline) {
        const dl = new Date(goal.deadline);
        const daysLeft = Math.ceil((dl.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        deadlineInfo = { daysLeft, color: daysLeft > 7 ? "#22c55e" : daysLeft > 0 ? "#f59e0b" : "#ef4444" };
      }
      return {
        theme: getDifficultyTheme(diff, customDifficultyColor),
        difficultyLabel: getDifficultyDisplayLabel(diff, customDifficultyName),
        progressPercent: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0,
        statusLabel: isCompleted ? "Completed" : getStatusLabel(goal.status || "not_started"),
        totalSteps: total,
        completedSteps: completed,
        intensity: getDifficultyIntensity(diff),
        deadlineInfo,
      };
    }, [goal, isCompleted, customDifficultyName, customDifficultyColor]);

  const cssVars = {
    "--accent": theme.color,
    "--accent-rgb": theme.rgb,
    "--intensity": intensity,
    "--percent": `${progressPercent}%`,
  } as React.CSSProperties;

  return (
    <div className="bar-card-root" style={cssVars} onClick={() => onNavigate(goal.id)}>
      <div className="bar-card-container noselect">
        <button
          className={`bar-card-focus-btn ${goal.is_focus ? "active" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggleFocus(goal.id, !!goal.is_focus, e); }}
        >
          <Star className="star-icon" size={14} fill={goal.is_focus ? theme.color : "none"} stroke={theme.color} />
        </button>

        <div className="bar-card-canvas">
          {[...Array(9)].map((_, i) => (
            <div key={i} className={`bar-card-tracker tr-${i + 1}`} />
          ))}
          <div className="bar-card-inner">
            <div className="bar-card-noise" />
            <div className="bar-card-content">
              <div className="bar-card-visual">
                <div className="bar-card-img-glow" />
                <div className="bar-card-img-frame">
                  {goal.image_url ? (
                    <img src={goal.image_url} alt={goal.name} loading="lazy" />
                  ) : (
                    <div className="bar-card-placeholder">
                      <Target size={24} />
                    </div>
                  )}
                </div>
                {totalSteps > 0 && (
                  <div
                    className="bar-card-mini-ring"
                    style={{ background: `conic-gradient(${theme.color} ${progressPercent}%, rgba(255,255,255,0.1) 0)` }}
                  >
                    <div className="bar-card-ring-inner">
                      {isCompleted ? <Trophy size={10} color={theme.color} /> : <TrendingUp size={10} color="white" />}
                    </div>
                  </div>
                )}
              </div>

              <div className="bar-card-info">
                <div className="bar-card-header">
                  <div className="bar-card-diff-tag">
                    <span className="bar-card-dot" />
                    {difficultyLabel}
                  </div>
                </div>
                <h3 className="bar-card-name">{goal.name}</h3>
                <div className="bar-card-meta">
                  <div className="bar-card-status">{statusLabel}</div>
                  {deadlineInfo && !isCompleted && (
                    <div className="bar-card-steps" style={{ color: deadlineInfo.color }}>
                      {deadlineInfo.daysLeft > 0 ? `${deadlineInfo.daysLeft}d` : deadlineInfo.daysLeft === 0 ? "Today" : `${Math.abs(deadlineInfo.daysLeft)}d late`}
                    </div>
                  )}
                  {totalSteps > 0 && (
                    <div className="bar-card-steps">
                      {completedSteps} <span className="bar-card-sep">/</span> {totalSteps}
                    </div>
                  )}
                </div>
                <div className="bar-card-progress">
                  <div className="bar-card-track">
                    <div className="bar-card-fill" />
                    <div className="bar-card-shine" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default BarViewGoalCard;
