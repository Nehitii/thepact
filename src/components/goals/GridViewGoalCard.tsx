import React, { useMemo } from "react";
import styled from "styled-components";
import { Star, Target, Zap, ImageOff } from "lucide-react";
import { getTagColor, getTagLabel, getStatusLabel, getDifficultyIntensity } from "@/lib/goalConstants";

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

const getDifficultyTheme = (difficulty: string, customColor?: string) => {
  switch (difficulty) {
    case "easy":
      return { color: "#16a34a", rgb: "22, 163, 74" };
    case "medium":
      return { color: "#eab308", rgb: "234, 179, 8" };
    case "hard":
      return { color: "#f97316", rgb: "249, 115, 22" };
    case "extreme":
      return { color: "#dc2626", rgb: "220, 38, 38" };
    case "impossible":
      return { color: "#a855f7", rgb: "168, 85, 247" };
    case "custom": {
      const base = customColor || "#a855f7";
      const hex = base.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) || 168;
      const g = parseInt(hex.substring(2, 4), 16) || 85;
      const b = parseInt(hex.substring(4, 6), 16) || 247;
      return { color: base, rgb: `${r}, ${g}, ${b}` };
    }
    default:
      return { color: "#6b7280", rgb: "107, 114, 128" };
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
  const {
    difficulty,
    isHabitGoal,
    totalSteps,
    completedSteps,
    progress,
    theme,
    statusLabel,
    displayTags,
    remainingTagsCount,
    intensity,
  } = useMemo(() => {
    const difficulty = goal.difficulty || "easy";
    const goalType = goal.goal_type || "standard";
    const isHabitGoal = goalType === "habit";

    const totalSteps = isHabitGoal ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
    const completedSteps = isHabitGoal ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;

    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const theme = getDifficultyTheme(difficulty, customDifficultyColor);
    const statusLabel = isCompleted ? "Completed" : getStatusLabel(goal.status || "not_started");

    const displayTags = goal.tags?.slice(0, 2) || (goal.type ? [goal.type] : []);
    const remainingTagsCount = Math.max(0, (goal.tags?.length || 0) - 2);

    const intensity = getDifficultyIntensity(difficulty);

    return {
      difficulty,
      isHabitGoal,
      totalSteps,
      completedSteps,
      progress,
      theme,
      statusLabel,
      displayTags,
      remainingTagsCount,
      intensity,
    };
  }, [
    goal.difficulty,
    goal.goal_type,
    goal.habit_duration_days,
    goal.habit_checks,
    goal.totalStepsCount,
    goal.completedStepsCount,
    goal.status,
    goal.tags,
    goal.type,
    isCompleted,
    customDifficultyColor,
  ]);

  return (
    <StyledWrapper
      $accentColor={theme.color}
      $accentRgb={theme.rgb}
      $intensity={intensity}
      onClick={() => onNavigate(goal.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onNavigate(goal.id);
      }}
    >
      <div className="card-container">
        <div className="card">
          {/* Background / Image layer (blur & scale on hover) */}
          <div className="img-content" aria-hidden="true">
            {goal.image_url ? (
              <img className="bg-image" src={goal.image_url} alt="" loading="lazy" />
            ) : (
              <div className="bg-fallback">
                <ImageOff className="fallback-icon" />
              </div>
            )}

            {/* top overlay row: focus + difficulty */}
            <div className="top-row">
              <button
                className={`focus-btn ${goal.is_focus ? "is-focus" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFocus(goal.id, !!goal.is_focus, e);
                }}
                aria-label={goal.is_focus ? "Unstar goal" : "Star goal"}
              >
                <Star className="star" />
              </button>

              <span className="difficulty-badge">{getDifficultyLabel(difficulty, customDifficultyName)}</span>
            </div>

            {/* center icon (habit/goal) */}
            <div className="center-icon">{isHabitGoal ? <Zap className="icon" /> : <Target className="icon" />}</div>

            {/* subtle scan shine (moves on hover) */}
            <div className="scan" />
          </div>

          {/* Foreground info panel (default visible, fades out on hover) */}
          <div className="info-panel">
            <h3 className="title" title={goal.name}>
              {goal.name}
            </h3>

            <div className="tags">
              {displayTags.map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="tag"
                  style={{ color: getTagColor(tag) }}
                  title={getTagLabel(tag)}
                >
                  {getTagLabel(tag)}
                </span>
              ))}
              {remainingTagsCount > 0 && <span className="tag more">+{remainingTagsCount}</span>}
            </div>

            <div className="meta">
              <span className="status" data-completed={statusLabel === "Completed" ? "true" : "false"}>
                {statusLabel}
              </span>
              <span className="steps">
                {completedSteps}/{totalSteps} {isHabitGoal ? "days" : "steps"}
              </span>
            </div>

            <div className="progress">
              <div className="progress-top">
                <span className="progress-label">Progress</span>
                <span className="progress-value">{progress}%</span>
              </div>
              <div className="bar">
                <div className="fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* Hover content (appears on hover) */}
          <div className="content">
            <p className="heading">{goal.name}</p>

            <div className="hover-meta">
              <div className="pill">
                <span className="pill-label">Status</span>
                <span className="pill-value">{statusLabel}</span>
              </div>

              <div className="pill">
                <span className="pill-label">Progress</span>
                <span className="pill-value">{progress}%</span>
              </div>

              <div className="pill">
                <span className="pill-label">{isHabitGoal ? "Days" : "Steps"}</span>
                <span className="pill-value">
                  {completedSteps}/{totalSteps}
                </span>
              </div>
            </div>

            <div className="hover-tags">
              {displayTags.slice(0, 2).map((tag, idx) => (
                <span
                  key={`h-${tag}-${idx}`}
                  className="hover-tag"
                  style={{
                    borderColor: `rgba(${theme.rgb}, 0.35)`,
                    color: getTagColor(tag),
                  }}
                >
                  {getTagLabel(tag)}
                </span>
              ))}
              {remainingTagsCount > 0 && <span className="hover-tag ghost">+{remainingTagsCount}</span>}
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ $accentColor: string; $accentRgb: string; $intensity: number }>`
  width: 300px;
  height: 300px;

  .card-container {
    width: 100%;
    height: 100%;
    position: relative;
    border-radius: 14px;
    cursor: pointer;
    isolation: isolate;
  }

  /* Glow background (difficulty-colored) */
  .card-container::before {
    content: "";
    z-index: -1;
    position: absolute;
    inset: 0;
    border-radius: 16px;
    background: linear-gradient(
      -45deg,
      rgba(${(p) => p.$accentRgb}, ${(p) => 0.25 + p.$intensity * 0.05}) 0%,
      rgba(${(p) => p.$accentRgb}, ${(p) => 0.05 + p.$intensity * 0.02}) 45%,
      rgba(${(p) => p.$accentRgb}, ${(p) => 0.22 + p.$intensity * 0.05}) 100%
    );
    transform: translate3d(0, 0, 0) scale(0.96);
    filter: blur(${(p) => 18 + p.$intensity * 4}px);
    opacity: 0.9;
    transition: opacity 300ms ease, transform 300ms ease, filter 300ms ease;
  }

  .card-container:hover::before {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(0.99);
    filter: blur(${(p) => 22 + p.$intensity * 5}px);
  }

  .card {
    width: 100%;
    height: 100%;
    border-radius: inherit;
    overflow: hidden;
    position: relative;
    background: #243137;
    border: 1px solid rgba(${(p) => p.$accentRgb}, ${(p) => 0.18 + p.$intensity * 0.05});
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  }

  /* Background layer */
  .img-content {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    background: linear-gradient(
      -45deg,
      rgba(${(p) => p.$accentRgb}, ${(p) => 0.35 + p.$intensity * 0.06}) 0%,
      rgba(${(p) => p.$accentRgb}, ${(p) => 0.06 + p.$intensity * 0.02}) 100%
    );

    transition: transform 600ms cubic-bezier(0.23, 1, 0.32, 1), filter 900ms ease, opacity 300ms ease;
    will-change: transform, filter;
  }

  .bg-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.8;
    transform: scale(1.02);
  }

  .bg-fallback {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: linear-gradient(
      135deg,
      rgba(${(p) => p.$accentRgb}, ${(p) => 0.18 + p.$intensity * 0.03}),
      rgba(0, 0, 0, 0.35)
    );
  }

  .fallback-icon {
    width: 40px;
    height: 40px;
    color: rgba(${(p) => p.$accentRgb}, 0.65);
  }

  .scan {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.08) 35%,
      rgba(255, 255, 255, 0) 65%
    );
    transform: translateX(-70%) skewX(-14deg);
    opacity: 0.0;
    pointer-events: none;
  }

  .top-row {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 5;
  }

  .focus-btn {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 1px solid rgba(${(p) => p.$accentRgb}, 0.35);
    background: rgba(0, 0, 0, 0.35);
    display: grid;
    place-items: center;
    transition: transform 200ms ease, background 200ms ease, border-color 200ms ease;
  }

  .focus-btn:hover {
    transform: scale(1.06);
    border-color: rgba(${(p) => p.$accentRgb}, 0.6);
    background: rgba(${(p) => p.$accentRgb}, 0.18);
  }

  .focus-btn .star {
    width: 16px;
    height: 16px;
    color: rgba(255, 255, 255, 0.65);
    fill: transparent;
    transition: color 200ms ease, fill 200ms ease;
  }

  .focus-btn.is-focus .star {
    color: ${(p) => p.$accentColor};
    fill: ${(p) => p.$accentColor};
  }

  .difficulty-badge {
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: ${(p) => p.$accentColor};
    background: rgba(${(p) => p.$accentRgb}, ${(p) => 0.14 + p.$intensity * 0.04});
    border: 1px solid rgba(${(p) => p.$accentRgb}, ${(p) => 0.35 + p.$intensity * 0.08});
    box-shadow: 0 0 ${(p) => 10 + p.$intensity * 3}px rgba(${(p) => p.$accentRgb}, 0.18);
  }

  .center-icon {
    position: relative;
    z-index: 4;
    width: 62px;
    height: 62px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(${(p) => p.$accentRgb}, 0.35);
    box-shadow: 0 0 ${(p) => 16 + p.$intensity * 4}px rgba(${(p) => p.$accentRgb}, 0.15);
    display: grid;
    place-items: center;
  }

  .center-icon .icon {
    width: 28px;
    height: 28px;
    color: ${(p) => p.$accentColor};
  }

  /* Default info panel (visible) */
  .info-panel {
    position: absolute;
    inset: 0;
    padding: 18px 18px 16px;
    display: flex;
    flex-direction: column;
    z-index: 6;

    opacity: 1;
    transform: translateY(0);
    transition: opacity 350ms ease, transform 350ms ease;
  }

  .title {
    margin-top: 52px; /* below top row */
    font-size: 15px;
    font-weight: 800;
    line-height: 1.2;
    color: ${(p) => p.$accentColor};
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .tag {
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(0, 0, 0, 0.22);
    color: rgba(255, 255, 255, 0.75);
  }

  .tag.more {
    color: rgba(255, 255, 255, 0.55);
    border-style: dashed;
  }

  .meta {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 11px;
  }

  .status {
    padding: 4px 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    text-transform: uppercase;
    letter-spacing: 0.7px;
    font-size: 9px;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.65);
  }

  .status[data-completed="true"] {
    color: rgba(34, 197, 94, 0.95);
    border-color: rgba(34, 197, 94, 0.35);
    background: rgba(34, 197, 94, 0.12);
  }

  .steps {
    color: rgba(255, 255, 255, 0.55);
    font-weight: 600;
  }

  .progress {
    margin-top: 12px;
  }

  .progress-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 11px;
  }

  .progress-label {
    color: rgba(255, 255, 255, 0.55);
    font-weight: 600;
  }

  .progress-value {
    color: ${(p) => p.$accentColor};
    font-weight: 800;
  }

  .bar {
    height: 6px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.1);
  }

  .fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(${(p) => p.$accentRgb}, 0.55), ${(p) => p.$accentColor});
    box-shadow: 0 0 ${(p) => 14 + p.$intensity * 4}px rgba(${(p) => p.$accentRgb}, 0.18);
    transition: width 600ms cubic-bezier(0.23, 1, 0.32, 1);
  }

  /* Hover content (hidden by default) */
  .content {
    position: absolute;
    inset: 0;
    padding: 22px 24px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 12px;

    color: #e8e8e8;
    opacity: 0;
    pointer-events: none;
    transform: translateY(46px);
    transition: opacity 600ms cubic-bezier(0.23, 1, 0.32, 1), transform 600ms cubic-bezier(0.23, 1, 0.32, 1);
    z-index: 7;
  }

  .heading {
    font-size: 22px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: 0.2px;
    margin: 0;
  }

  .hover-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .pill {
    border-radius: 12px;
    padding: 10px 10px;
    background: rgba(0, 0, 0, 0.28);
    border: 1px solid rgba(${(p) => p.$accentRgb}, 0.22);
  }

  .pill-label {
    display: block;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.55);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .pill-value {
    display: block;
    font-size: 13px;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.9);
  }

  .hover-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 6px;
  }

  .hover-tag {
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(${(p) => p.$accentRgb}, 0.25);
    color: rgba(255, 255, 255, 0.8);
  }

  .hover-tag.ghost {
    border-style: dashed;
    color: rgba(255, 255, 255, 0.55);
  }

  /* Hover interactions (matching your sample card behavior) */
  .card:hover .img-content {
    transform: scale(2.2) rotate(18deg);
    filter: blur(7px) saturate(1.05);
  }

  .card:hover .scan {
    opacity: 1;
    animation: scan-move 900ms ease-in-out both;
  }

  .card:hover .content {
    opacity: 1;
    transform: translateY(0);
  }

  .card:hover .info-panel {
    opacity: 0;
    transform: translateY(-10px);
    pointer-events: none;
  }

  @keyframes scan-move {
    0% {
      transform: translateX(-70%) skewX(-14deg);
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    100% {
      transform: translateX(70%) skewX(-14deg);
      opacity: 0;
    }
  }

  /* Accessibility: reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .card-container::before,
    .img-content,
    .content,
    .info-panel,
    .scan,
    .fill {
      transition: none !important;
      animation: none !important;
    }
    .card:hover .img-content {
      transform: none;
      filter: none;
    }
  }
`;

export default GridViewGoalCard;
