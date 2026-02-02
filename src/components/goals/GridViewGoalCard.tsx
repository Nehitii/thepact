import React, { useMemo } from "react";
import styled from "styled-components";
import { Star, Target, Zap, Trophy, TrendingUp, ImageOff } from "lucide-react";
import { getTagColor, getTagLabel, getStatusLabel, getDifficultyIntensity } from "@/lib/goalConstants";

// --- Interfaces (inchangées) ---
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
    const prog = total > 0 ? Math.round((completed / total) * 100) : 0;

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

  return (
    <StyledWrapper
      $accentColor={theme.color}
      $accentRgb={theme.rgb}
      $intensity={intensity}
      $progress={progress}
      onClick={() => onNavigate(goal.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onNavigate(goal.id);
      }}
    >
      <div className="card-inner">
        {/* --- Background Image Layer --- */}
        <div className="image-layer">
          {goal.image_url ? (
            <img src={goal.image_url} alt="" loading="lazy" />
          ) : (
            <div className="fallback-pattern">
              <ImageOff size={48} strokeWidth={1} opacity={0.3} />
            </div>
          )}
          <div className="gradient-overlay" />
        </div>

        {/* --- Top Controls (Difficulty & Favorite) --- */}
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
          >
            <Star className="icon" weight={goal.is_focus ? "fill" : "regular"} />
          </button>
        </div>

        {/* --- Main Content (Bottom) --- */}
        <div className="content-area">
          {/* Main Info (Always visible, moves up on hover) */}
          <div className="primary-info">
            <div className="icon-badge">{isHabitGoal ? <Zap size={14} /> : <Target size={14} />}</div>
            <h3 className="title">{goal.name}</h3>
          </div>

          {/* Progress Bar (Always visible) */}
          <div className="progress-track">
            <div className="progress-fill" />
          </div>

          {/* Hidden Details (Slide in on hover) */}
          <div className="details-reveal">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="label">Status</span>
                <span className="value" style={{ color: isCompleted ? theme.color : "inherit" }}>
                  {statusLabel}
                </span>
              </div>
              <div className="stat-item right">
                <span className="label">{isHabitGoal ? "Days" : "Steps"}</span>
                <span className="value">
                  {completedSteps} <span className="dim">/ {totalSteps}</span>
                </span>
              </div>
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
        </div>

        {/* --- Aesthetic borders --- */}
        <div className="border-glow" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ $accentColor: string; $accentRgb: string; $intensity: number; $progress: number }>`
  width: 100%;
  aspect-ratio: 4/5; /* Ratio "Portrait" plus élégant pour une grille */
  position: relative;
  perspective: 1000px;
  cursor: pointer;

  .card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 20px;
    background: #121212;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.4s ease;
    isolation: isolate;
  }

  /* --- Image Layer --- */
  .image-layer {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .image-layer img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.7s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .fallback-pattern {
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at top right, #2a2a2a, #1a1a1a);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #444;
  }

  /* Gradient pour lisibilité du texte */
  .gradient-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.1) 0%,
      rgba(0,0,0,0.2) 40%,
      rgba(0,0,0,0.85) 90%,
      rgba(0,0,0,0.95) 100%
    );
    z-index: 1;
  }

  /* --- Top Bar --- */
  .top-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    z-index: 10;
  }

  .difficulty-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 30px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #eee;
    text-transform: uppercase;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }

  .difficulty-pill .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${(props) => props.$accentColor};
    box-shadow: 0 0 8px ${(props) => props.$accentColor};
  }

  .fav-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    border: 1px solid transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.6);
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .fav-btn:hover {
    background: rgba(255,255,255,0.1);
    transform: scale(1.1);
    color: white;
  }

  .fav-btn.active {
    background: rgba(${(props) => props.$accentRgb}, 0.2);
    border-color: rgba(${(props) => props.$accentRgb}, 0.5);
    color: ${(props) => props.$accentColor};
  }
  
  .fav-btn .icon {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }

  /* --- Content Area --- */
  .content-area {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transform: translateY(calc(100% - 76px)); /* Cache les détails par défaut */
    transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  
  /* Ajustement si pas de tags/stats pour ne pas casser le layout */
  @media (hover: none) {
    .content-area { transform: translateY(0); }
  }

  .primary-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .icon-badge {
    width: fit-content;
    padding: 4px 8px;
    background: rgba(${(props) => props.$accentRgb}, 0.15);
    border-radius: 6px;
    color: ${(props) => props.$accentColor};
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(${(props) => props.$accentRgb}, 0.2);
  }

  .title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.3;
    color: white;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* --- Progress Bar --- */
  .progress-track {
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    width: ${(props) => props.$progress}%;
    background: ${(props) => props.$accentColor};
    box-shadow: 0 0 10px ${(props) => props.$accentColor};
    transition: width 1s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  /* --- Revealed Details --- */
  .details-reveal {
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 4px;
  }

  .stats-grid {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255,255,255,0.1);
    padding-top: 12px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .stat-item.right { align-items: flex-end; }

  .label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #888;
    font-weight: 600;
  }

  .value {
    font-size: 13px;
    font-weight: 700;
    color: #eee;
    font-variant-numeric: tabular-nums;
  }
  
  .dim { color: #666; font-size: 11px; }

  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .mini-tag {
    font-size: 9px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(0,0,0,0.3);
    opacity: 0.9;
  }
  
  .mini-tag.more {
    border-style: dashed;
    color: #888;
    border-color: #444;
  }

  /* --- Borders & Glows --- */
  .border-glow {
    position: absolute;
    inset: 0;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    pointer-events: none;
    z-index: 20;
    transition: border-color 0.3s ease;
  }

  /* --- HOVER EFFECTS --- */
  
  &:hover .card-inner {
    transform: translateY(-6px);
    box-shadow: 
      0 12px 30px rgba(0,0,0,0.5),
      0 0 0 1px rgba(${(props) => props.$accentRgb}, 0.3);
  }

  &:hover .image-layer img {
    transform: scale(1.08); /* Zoom subtil */
  }

  &:hover .content-area {
    transform: translateY(0); /* Glisse vers le haut pour révéler */
  }

  &:hover .details-reveal {
    opacity: 1;
    transform: translateY(0);
    transition-delay: 0.1s;
  }
  
  &:hover .border-glow {
    border-color: rgba(${(props) => props.$accentRgb}, 0.5);
  }
`;

export default GridViewGoalCard;
