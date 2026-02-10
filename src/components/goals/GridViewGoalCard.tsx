import React, { useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { Star, Target, Zap, ImageOff, CheckCircle2 } from "lucide-react";
import { getTagColor, getTagLabel, getStatusLabel, getDifficultyIntensity } from "@/lib/goalConstants";

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
      // Simple hex to rgb conversion fallback
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
    const diff = goal.difficulty || "easy";
    const goalType = goal.goal_type || "standard";
    const isHabit = goalType === "habit";

    const total = isHabit ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
    const completed = isHabit ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;
    // Cap progress at 100%
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
      intensity: getDifficultyIntensity(diff),
    };
  }, [goal, isCompleted, customDifficultyColor]);

  // Handle keyboard interaction for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onNavigate(goal.id);
    }
  };

  return (
    <StyledWrapper
      $accentColor={theme.color}
      $accentRgb={theme.rgb}
      $progress={progress}
      $isCompleted={isCompleted}
      onClick={() => onNavigate(goal.id)}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="group"
    >
      <div className="card-inner">
        {/* --- Background Image Layer --- */}
        <div className="image-layer">
          {goal.image_url ? (
            <img src={goal.image_url} alt={goal.name} loading="lazy" />
          ) : (
            <div className="fallback-pattern">
              <ImageOff size={48} strokeWidth={1} opacity={0.3} />
            </div>
          )}
          <div className="gradient-overlay" />
        </div>

        {/* --- Hover Shine Effect --- */}
        <div className="shine-effect" />

        {/* --- Top Controls --- */}
        <div className="top-bar">
          <div className="difficulty-pill">
            <span className="dot" />
            {getDifficultyLabel(difficulty, customDifficultyName)}
          </div>

          <button
            className={`fav-btn ${goal.is_focus ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFocus(goal.id, !!goal.is_focus, e);
            }}
            aria-label={goal.is_focus ? "Remove from focus" : "Set as focus"}
          >
            <Star className="icon" fill={goal.is_focus ? "currentColor" : "none"} strokeWidth={goal.is_focus ? 0 : 2} />
          </button>
        </div>

        {/* --- Main Content (Bottom) --- */}
        <div className="content-area glass-panel">
          {/* Primary Info */}
          <div className="primary-info">
            <div className="header-row">
              <div className="icon-badge">
                {isCompleted ? <CheckCircle2 size={14} /> : isHabitGoal ? <Zap size={14} /> : <Target size={14} />}
              </div>
              <div className="tags-row">
                {displayTags.map((tag, i) => (
                  <span key={i} className="mini-tag" style={{ borderColor: getTagColor(tag), color: getTagColor(tag) }}>
                    {getTagLabel(tag)}
                  </span>
                ))}
                {remainingTagsCount > 0 && <span className="mini-tag more">+{remainingTagsCount}</span>}
              </div>
            </div>
            <h3 className="title">{goal.name}</h3>
          </div>

          {/* Progress Section */}
          <div className="progress-section">
            <div className="stats-row">
              <span className="label status-text">{statusLabel}</span>
              <span className="value">{progress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" />
            </div>
            <div className="stats-detail">
              <span className="dim">
                {completedSteps} / {totalSteps} {isHabitGoal ? "days" : "steps"}
              </span>
            </div>
          </div>
        </div>

        {/* --- Aesthetic borders --- */}
        <div className="border-glow" />
      </div>
    </StyledWrapper>
  );
}

// --- STYLES ---

const shimmer = keyframes`
  0% { transform: translateX(-150%) skewX(-20deg); }
  100% { transform: translateX(150%) skewX(-20deg); }
`;

const StyledWrapper = styled.article<{
  $accentColor: string;
  $accentRgb: string;
  $progress: number;
  $isCompleted: boolean;
}>`
  /* --- Variables CSS dynamiques pour la performance --- */
  --accent: ${(props) => props.$accentColor};
  --accent-rgb: ${(props) => props.$accentRgb};
  --progress: ${(props) => props.$progress}%;
  
  position: relative;
  width: 100%;
  aspect-ratio: 4/5;
  perspective: 1000px;
  cursor: pointer;
  user-select: none;
  border-radius: 20px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Fallback height */
  @supports not (aspect-ratio: 4/5) {
    height: 380px;
  }

  /* État complété : saturation réduite */
  ${(props) =>
    props.$isCompleted &&
    css`
    filter: grayscale(0.4);
    &:hover { filter: grayscale(0); }
  `}

  /* --- CARD INTERIOR --- */
  .card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 20px;
    background: #09090b; /* Zinc-950 equivalent */
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  /* --- Images --- */
  .image-layer {
    position: absolute;
    inset: 0;
    z-index: 0;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.7s ease-out;
      opacity: 0.8;
    }
  }

  .fallback-pattern {
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, #1f2937, #111827);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #374151;
  }

  .gradient-overlay {
    position: absolute;
    inset: 0;
    /* Gradient amélioré pour lisibilité du bas */
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.1) 0%,
      rgba(0,0,0,0.2) 50%,
      rgba(0,0,0,0.9) 100%
    );
    z-index: 1;
  }

  /* --- Shine Effect --- */
  .shine-effect {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.05) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: translateX(-150%);
    z-index: 2;
    pointer-events: none;
  }

  /* --- Top Bar --- */
  .top-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 14px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    z-index: 10;
  }

  .difficulty-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 99px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #f3f4f6;
    text-transform: uppercase;
    
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent);
    }
  }

  .fav-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.6);
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    cursor: pointer;

    &:hover {
      background: rgba(255,255,255,0.2);
      transform: scale(1.1);
      color: white;
    }

    &.active {
      background: rgba(var(--accent-rgb), 0.2);
      border-color: var(--accent);
      color: var(--accent);
      box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.3);
    }
    
    .icon {
      width: 16px;
      height: 16px;
    }
  }

  /* --- Glass Panel Content --- */
  .glass-panel {
    position: absolute;
    bottom: 12px;
    left: 12px;
    right: 12px;
    padding: 16px;
    border-radius: 16px;
    background: rgba(20, 20, 25, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transform: translateY(0);
    transition: transform 0.3s ease, background 0.3s ease;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .icon-badge {
    color: var(--accent);
    filter: drop-shadow(0 0 4px rgba(var(--accent-rgb), 0.4));
  }

  .tags-row {
    display: flex;
    gap: 4px;
  }

  .mini-tag {
    font-size: 9px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 6px;
    border: 1px solid;
    background: rgba(0,0,0,0.4);
    text-transform: uppercase;
    
    &.more {
      border-style: dashed;
      color: #9ca3af !important;
      border-color: #4b5563 !important;
    }
  }

  .title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.3;
    color: #fff;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    /* Petit effet subtil pour le texte */
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  }

  /* --- Progress Section --- */
  .progress-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stats-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    font-weight: 600;
  }

  .status-text {
    color: ${(props) => (props.$isCompleted ? "var(--accent)" : "#9ca3af")};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .value {
    color: #f3f4f6;
    font-variant-numeric: tabular-nums;
  }

  .progress-track {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 99px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    width: var(--progress);
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent);
    border-radius: 99px;
    transition: width 1s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  
  .stats-detail {
    display: flex;
    justify-content: flex-end;
    
    .dim {
      font-size: 10px;
      color: #6b7280;
    }
  }

  /* --- Borders & Glows --- */
  .border-glow {
    position: absolute;
    inset: 0;
    border-radius: 20px;
    border: 1px solid transparent;
    pointer-events: none;
    z-index: 20;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }

  /* --- HOVER EFFECTS --- */
  &:hover {
    transform: translateY(-4px);
    
    .card-inner {
      box-shadow: 
        0 20px 40px -5px rgba(0,0,0,0.6),
        0 0 0 1px rgba(var(--accent-rgb), 0.3);
      border-color: rgba(var(--accent-rgb), 0.3);
    }

    .shine-effect {
      animation: ${shimmer} 1s forwards;
    }

    .image-layer img {
      transform: scale(1.05);
      opacity: 1;
    }

    .glass-panel {
      background: rgba(20, 20, 25, 0.85);
      border-color: rgba(255,255,255,0.15);
    }
    
    .border-glow {
      border-color: rgba(var(--accent-rgb), 0.4);
      box-shadow: inset 0 0 20px rgba(var(--accent-rgb), 0.05);
    }
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

export default GridViewGoalCard;
