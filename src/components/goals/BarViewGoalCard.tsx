import React, { memo, useMemo } from "react";
import { Star, Target, Trophy } from "lucide-react";
import { DIFFICULTY_OPTIONS, getStatusLabel, getDifficultyIntensity, getGoalStatusIcon } from "@/lib/goalConstants";
import { SharedGoalBadge } from "@/components/goals/SharedGoalBadge";
import { GoalLockOverlay } from "@/components/goals/GoalLockOverlay";

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
  isShared?: boolean;
  isReadOnly?: boolean;
  sharedByName?: string;
  is_locked?: boolean;
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
    case "easy":
      return { color: "#22c55e", rgb: "34, 197, 94" };
    case "medium":
      return { color: "#fbbf24", rgb: "251, 191, 36" };
    case "hard":
      return { color: "#f97316", rgb: "249, 115, 22" };
    case "extreme":
      return { color: "#ef4444", rgb: "239, 68, 68" };
    case "impossible":
      return { color: "#d946ef", rgb: "217, 70, 239" };
    case "custom": {
      const base = customColor || "#a855f7";
      const hex = base.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) || 168;
      const g = parseInt(hex.substring(2, 4), 16) || 85;
      const b = parseInt(hex.substring(4, 6), 16) || 247;
      return { color: base, rgb: `${r}, ${g}, ${b}` };
    }
    default:
      return { color: "#94a3b8", rgb: "148, 163, 184" };
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
  const { theme, difficultyLabel, progressPercent, statusLabel, totalSteps, completedSteps, intensity, deadlineInfo, kpi } =
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
      const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
      const intensityVal = getDifficultyIntensity(diff);

      // Derive a contextual KPI
      let kpi: { value: React.ReactNode; label: string } = {
        value: <>{intensityVal}<span className="unit">/5</span></>,
        label: "Intensity",
      };
      if (isCompleted) {
        kpi = { value: <Trophy size={24} strokeWidth={2.2} />, label: "Done" };
      } else if (total > 0) {
        kpi = { value: <>{percent}<span className="unit">%</span></>, label: "Progress" };
      } else if (deadlineInfo) {
        const d = deadlineInfo.daysLeft;
        kpi = {
          value: <>{Math.abs(d)}<span className="unit">d</span></>,
          label: d > 0 ? "Remaining" : d === 0 ? "Today" : "Overdue",
        };
      }

      return {
        theme: getDifficultyTheme(diff, customDifficultyColor),
        difficultyLabel: getDifficultyDisplayLabel(diff, customDifficultyName),
        progressPercent: percent,
        statusLabel: isCompleted ? "Completed" : getStatusLabel(goal.status || "not_started"),
        totalSteps: total,
        completedSteps: completed,
        intensity: intensityVal,
        deadlineInfo,
        kpi,
      };
    }, [goal, isCompleted, customDifficultyName, customDifficultyColor]);

  const cssVars = {
    "--accent": theme.color,
    "--accent-rgb": theme.rgb,
    "--intensity": intensity,
    "--halo-intensity": intensity,
    "--percent": `${progressPercent}%`,
  } as React.CSSProperties;

  const StatusIcon = getGoalStatusIcon(goal.status || (isCompleted ? "fully_completed" : "not_started"));

  return (
    <div
      className={`bar-card-root rarity-halo${goal.is_focus ? " is-focus" : ""}`}
      style={cssVars}
      data-halo={intensity}
      onClick={() => onNavigate(goal.id)}
    >
      {goal.is_locked && <GoalLockOverlay className="z-50" />}
      <div className="bar-card-container noselect">
        <div className="bar-card-scanline" aria-hidden="true" />

        <button
          type="button"
          aria-label={goal.is_focus ? "Unset focus" : "Set as focus"}
          className={`bar-card-focus-btn ${goal.is_focus ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFocus(goal.id, !!goal.is_focus, e);
          }}
        >
          <Star className="star-icon" size={14} fill={goal.is_focus ? theme.color : "none"} stroke={theme.color} />
        </button>

        <div className="bar-card-content">
          {/* Visual block */}
          <div className="bar-card-visual">
            <div className="bar-card-img-glow" />
            <div className="bar-card-img-frame">
              {goal.image_url ? (
                <img src={goal.image_url} alt={goal.name} loading="lazy" />
              ) : (
                <div className="bar-card-placeholder">
                  <Target size={28} strokeWidth={1.8} />
                </div>
              )}
            </div>
            {totalSteps > 0 && (
              <div
                className="bar-card-mini-ring"
                style={{
                  background: `conic-gradient(${theme.color} ${progressPercent}%, rgba(255,255,255,0.08) 0)`,
                }}
              >
                <div className="bar-card-ring-inner">
                  {isCompleted ? <Trophy size={11} /> : `${progressPercent}`}
                </div>
              </div>
            )}
          </div>

          {/* Info block */}
          <div className="bar-card-info">
            <div className="bar-card-diff-chip">
              <span className="bar-card-dot" />
              {difficultyLabel}
            </div>
            <h3 className="bar-card-name">{goal.name}</h3>
            <div className="bar-card-meta">
              <span className="bar-card-status">
                <StatusIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                {statusLabel}
              </span>
              {deadlineInfo && !isCompleted && (
                <>
                  <span className="bar-card-meta-divider" aria-hidden="true" />
                  <span className="bar-card-steps" style={{ color: deadlineInfo.color }}>
                    {deadlineInfo.daysLeft > 0
                      ? `${deadlineInfo.daysLeft}d`
                      : deadlineInfo.daysLeft === 0
                        ? "Today"
                        : `${Math.abs(deadlineInfo.daysLeft)}d late`}
                  </span>
                </>
              )}
              {totalSteps > 0 && (
                <>
                  <span className="bar-card-meta-divider" aria-hidden="true" />
                  <span className="bar-card-steps">
                    {completedSteps}<span className="bar-card-sep"> / </span>{totalSteps}
                  </span>
                </>
              )}
              {goal.isShared && <SharedGoalBadge ownerName={goal.sharedByName} />}
            </div>
            <div className="bar-card-progress">
              <div className="bar-card-track">
                <div className="bar-card-fill" />
                <div className="bar-card-shine" />
              </div>
            </div>
          </div>

          {/* KPI block (right) */}
          <div className="bar-card-kpi" aria-hidden="true">
            <div className="bar-card-kpi-value">{kpi.value}</div>
            <div className="bar-card-kpi-label">{kpi.label}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default BarViewGoalCard;
