import React, { memo, useMemo } from "react";
import styled from "styled-components";
import { Star, Target } from "lucide-react";
import { DIFFICULTY_OPTIONS, getStatusLabel, getDifficultyIntensity } from "@/lib/goalConstants";

/**
 * PERFORMANCE OPTIMIZATIONS APPLIED:
 * 1. React.memo to prevent unnecessary re-renders
 * 2. useMemo for derived values (colors, labels, progress)
 * 3. CSS animations only run on hover (paused by default)
 * 4. Reduced blur/shadow effects - moved heavy effects to hover state
 * 5. Lazy loading for goal images
 * 6. Reduced tracker grid from 25 to 9 zones (3x3 provides same effect)
 * 7. CSS containment for layout isolation
 * 8. prefers-reduced-motion support
 */

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
}

interface BarViewGoalCardProps {
  goal: Goal;
  isCompleted?: boolean;
  customDifficultyName?: string;
  customDifficultyColor?: string;
  onNavigate: (goalId: string) => void;
  onToggleFocus: (goalId: string, currentFocus: boolean, e: React.MouseEvent) => void;
}

// Get difficulty theme with color and RGB values
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

// Get difficulty label
const getDifficultyDisplayLabel = (difficulty: string, customName: string): string => {
  if (difficulty === "custom") return customName || "Custom";
  const found = DIFFICULTY_OPTIONS.find((d) => d.value === difficulty);
  return found?.value
    ? found.value.charAt(0).toUpperCase() + found.value.slice(1)
    : difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

// Memoized card component for performance
export const BarViewGoalCard = memo(function BarViewGoalCard({
  goal,
  isCompleted = false,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
  onNavigate,
  onToggleFocus,
}: BarViewGoalCardProps) {
  // Memoize derived values to prevent recalculation
  const { theme, difficultyLabel, progressPercent, statusLabel, totalSteps, completedSteps, intensity } =
    useMemo(() => {
      const diff = goal.difficulty || "easy";
      const total = goal.totalStepsCount || 0;
      const completed = goal.completedStepsCount || 0;

      return {
        theme: getDifficultyTheme(diff, customDifficultyColor),
        difficultyLabel: getDifficultyDisplayLabel(diff, customDifficultyName),
        progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
        statusLabel: isCompleted ? "Completed" : getStatusLabel(goal.status || "not_started"),
        totalSteps: total,
        completedSteps: completed,
        intensity: getDifficultyIntensity(diff),
      };
    }, [
      goal.difficulty,
      goal.totalStepsCount,
      goal.completedStepsCount,
      goal.status,
      isCompleted,
      customDifficultyName,
      customDifficultyColor,
    ]);

  return (
    <StyledWrapper
      $accentColor={theme.color}
      $accentRgb={theme.rgb}
      $intensity={intensity}
      onClick={() => onNavigate(goal.id)}
    >
      <div className="container noselect">
        <div className="canvas">
          {/* Reduced tracker grid: 3x3 = 9 zones instead of 5x5 = 25 for performance */}
          <div className="tracker tr-1" />
          <div className="tracker tr-2" />
          <div className="tracker tr-3" />
          <div className="tracker tr-4" />
          <div className="tracker tr-5" />
          <div className="tracker tr-6" />
          <div className="tracker tr-7" />
          <div className="tracker tr-8" />
          <div className="tracker tr-9" />

          <div id="card">
            <div className="card-content">
              {/* Left side: Image thumbnail */}
              <div className="image-frame">
                {goal.image_url ? (
                  <img src={goal.image_url} alt={goal.name} loading="lazy" className="goal-image" />
                ) : (
                  <div className="image-placeholder">
                    <Target className="placeholder-icon" />
                  </div>
                )}
              </div>

              {/* Content area */}
              <div className="info-section">
                {/* Difficulty badge - exact match to GridView/BookmarkView */}
                <div className="difficulty-badge">
                  <span className="badge-text">{difficultyLabel}</span>
                  <div className="badge-glossy" />
                </div>

                {/* Goal name */}
                <h3 className="goal-name">{goal.name}</h3>

                {/* Status badge (hover only) */}
                <div className="status-badge">{statusLabel}</div>
              </div>

              {/* Focus star (top-right, hover only, starred only) */}
              {goal.is_focus && (
                <button
                  className="focus-star"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFocus(goal.id, !!goal.is_focus, e);
                  }}
                >
                  <Star className="star-icon" />
                </button>
              )}

              {/* Progress section (hover reveal) */}
              <div className="progress-section">
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="progress-text">
                  <span className="steps-count">
                    {completedSteps}/{totalSteps} steps
                  </span>
                  <span className="progress-percent">{progressPercent}%</span>
                </div>
              </div>

              {/* Corner accents */}
              <div className="corner-elements">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
});

const StyledWrapper = styled.div<{ $accentColor: string; $accentRgb: string; $intensity: number }>`
  /* Single card per row layout */
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 12px 16px;
  contain: layout style;

  .container {
    position: relative;
    width: 100%;
    max-width: 680px;
    height: 140px;
    cursor: pointer;
  }

  /* Canvas with 3x3 tracker grid (reduced from 5x5 for performance) */
  .canvas {
    perspective: 800px;
    inset: 0;
    z-index: 10;
    position: absolute;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }

  .tracker {
    z-index: 200;
  }

  /* Card base + premium difficulty glow (2-layer: aura + ring) */
  #card {
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: 16px;
    transition: transform 200ms ease, box-shadow 200ms ease, filter 200ms ease;
    background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%);
    overflow: hidden;

    /* Difficulty-coded border, stays subtle */
    border: 1.5px solid rgba(${(props) => props.$accentRgb}, ${(props) => 0.18 + props.$intensity * 0.08});

    /* Base depth (keep cheap) */
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);

    /* Make pseudo-elements behave predictably */
    isolation: isolate;
  }

  /* Diffuse aura (behind the card) */
  #card::before {
    content: "";
    position: absolute;
    inset: -18px;
    border-radius: 22px;
    z-index: -1;
    pointer-events: none;

    background: radial-gradient(
      60% 55% at 50% 45%,
      rgba(${(props) => props.$accentRgb}, ${(props) => 0.07 + props.$intensity * 0.035}) 0%,
      rgba(${(props) => props.$accentRgb}, ${(props) => 0.035 + props.$intensity * 0.02}) 35%,
      rgba(${(props) => props.$accentRgb}, 0) 70%
    );

    filter: blur(${(props) => 10 + props.$intensity * 3}px);
    opacity: 0.9;
    transform: translateZ(0);
  }

  /* Crisp ring + subtle highlight near edges */
  #card::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 16px;
    pointer-events: none;
    z-index: 1;

    background:
      linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0)),
      radial-gradient(
        120% 140% at 10% 0%,
        rgba(${(props) => props.$accentRgb}, ${(props) => 0.18 + props.$intensity * 0.06}) 0%,
        rgba(${(props) => props.$accentRgb}, 0) 55%
      );

    box-shadow:
      0 0 ${(props) => 10 + props.$intensity * 4}px rgba(${(props) => props.$accentRgb}, ${(props) => 0.08 + props.$intensity * 0.03}),
      inset 0 0 0 1px rgba(${(props) => props.$accentRgb}, ${(props) => 0.08 + props.$intensity * 0.02});

    opacity: 0.85;
    mix-blend-mode: screen;
  }

  .card-content {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 16px 20px;
    gap: 16px;
    z-index: 2; /* above the ring */
  }

  /* Image thumbnail frame (left side) */
  .image-frame {
    flex-shrink: 0;
    width: 72px;
    height: 72px;
    border-radius: 10px;
    overflow: hidden;
    border: 2px solid rgba(${(props) => props.$accentRgb}, 0.4);
    box-shadow: 0 0 12px rgba(${(props) => props.$accentRgb}, 0.15);
    background: rgba(0, 0, 0, 0.3);
  }

  .goal-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      135deg,
      rgba(${(props) => props.$accentRgb}, 0.1),
      rgba(${(props) => props.$accentRgb}, 0.05)
    );
  }

  .placeholder-icon {
    width: 28px;
    height: 28px;
    color: rgba(${(props) => props.$accentRgb}, 0.5);
  }

  /* Info section */
  .info-section {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Difficulty badge - matching GridView/BookmarkView exactly */
  .difficulty-badge {
    position: relative;
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 5px 14px;
    border-radius: 20px;
    overflow: hidden;
    background: linear-gradient(
      135deg,
      rgba(${(props) => props.$accentRgb}, ${(props) => 0.15 + props.$intensity * 0.05}) 0%,
      rgba(${(props) => props.$accentRgb}, ${(props) => 0.08 + props.$intensity * 0.03}) 100%
    );
    border: 1px solid rgba(${(props) => props.$accentRgb}, ${(props) => 0.35 + props.$intensity * 0.1});
    box-shadow:
      0 2px 8px rgba(${(props) => props.$accentRgb}, ${(props) => 0.15 + props.$intensity * 0.05}),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .badge-text {
    position: relative;
    z-index: 2;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: ${(props) => props.$accentColor};
  }

  /* Glossy overlay - matches BookmarkView */
  .badge-glossy {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0) 50%,
      rgba(0, 0, 0, 0.1) 100%
    );
    z-index: 1;
    pointer-events: none;
  }

  /* Goal name */
  .goal-name {
    font-size: 15px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }

  /* Status badge - hover reveal */
  .status-badge {
    display: inline-flex;
    width: fit-content;
    padding: 4px 10px;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.12);
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 250ms ease, transform 250ms ease;
  }

  /* Focus star - hover only */
  .focus-star {
    position: absolute;
    top: 12px;
    right: 14px;
    z-index: 25;
    padding: 6px;
    border-radius: 50%;
    background: rgba(${(props) => props.$accentRgb}, 0.2);
    border: 1px solid rgba(${(props) => props.$accentRgb}, 0.4);
    opacity: 0;
    transform: scale(0.8);
    transition: all 250ms ease;
    cursor: pointer;
  }

  .focus-star .star-icon {
    width: 14px;
    height: 14px;
    color: ${(props) => props.$accentColor};
    fill: ${(props) => props.$accentColor};
  }

  /* Progress section - hover reveal */
  .progress-section {
    position: absolute;
    bottom: 12px;
    left: 108px;
    right: 20px;
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 250ms ease, transform 250ms ease;
    z-index: 2;
  }

  .progress-bar-container {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, rgba(${(props) => props.$accentRgb}, 0.6), ${(props) => props.$accentColor});
    border-radius: 2px;
    transition: width 300ms ease;
  }

  .progress-text {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 10px;
  }

  .steps-count {
    color: rgba(255, 255, 255, 0.5);
  }

  .progress-percent {
    font-weight: 600;
    color: ${(props) => props.$accentColor};
  }

  /* Corner elements */
  .corner-elements {
    pointer-events: none;
  }

  .corner-elements span {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 1.5px solid rgba(${(props) => props.$accentRgb}, 0.25);
    transition: all 250ms ease;
  }

  .corner-elements span:nth-child(1) {
    top: 8px;
    left: 8px;
    border-right: 0;
    border-bottom: 0;
  }

  .corner-elements span:nth-child(2) {
    top: 8px;
    right: 8px;
    border-left: 0;
    border-bottom: 0;
  }

  .corner-elements span:nth-child(3) {
    bottom: 8px;
    left: 8px;
    border-right: 0;
    border-top: 0;
  }

  .corner-elements span:nth-child(4) {
    bottom: 8px;
    right: 8px;
    border-left: 0;
    border-top: 0;
  }

  /* 3x3 Tracker hover transforms */
  .tr-1:hover ~ #card { transform: rotateX(8deg) rotateY(-8deg); }
  .tr-2:hover ~ #card { transform: rotateX(8deg) rotateY(0deg); }
  .tr-3:hover ~ #card { transform: rotateX(8deg) rotateY(8deg); }
  .tr-4:hover ~ #card { transform: rotateX(0deg) rotateY(-8deg); }
  .tr-5:hover ~ #card { transform: rotateX(0deg) rotateY(0deg); }
  .tr-6:hover ~ #card { transform: rotateX(0deg) rotateY(8deg); }
  .tr-7:hover ~ #card { transform: rotateX(-8deg) rotateY(-8deg); }
  .tr-8:hover ~ #card { transform: rotateX(-8deg) rotateY(0deg); }
  .tr-9:hover ~ #card { transform: rotateX(-8deg) rotateY(8deg); }

  /* Hover state effects */
  .tracker:hover ~ #card {
    filter: brightness(1.08) saturate(1.05);
    box-shadow:
      0 10px 28px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .tracker:hover ~ #card::before {
    opacity: 1;
    filter: blur(${(props) => 14 + props.$intensity * 4}px);
  }

  .tracker:hover ~ #card::after {
    opacity: 1;
    box-shadow:
      0 0 34px rgba(${(props) => props.$accentRgb}, ${(props) => 0.16 + props.$intensity * 0.05}),
      inset 0 0 0 1px rgba(${(props) => props.$accentRgb}, ${(props) => 0.14 + props.$intensity * 0.03});
  }

  .tracker:hover ~ #card .status-badge {
    opacity: 1;
    transform: translateY(0);
  }

  .tracker:hover ~ #card .focus-star {
    opacity: 1;
    transform: scale(1);
  }

  .tracker:hover ~ #card .progress-section {
    opacity: 1;
    transform: translateY(0);
  }

  .tracker:hover ~ #card .corner-elements span {
    border-color: rgba(${(props) => props.$accentRgb}, 0.6);
  }

  /* Accessibility: respect reduced motion */
  @media (prefers-reduced-motion: reduce) {
    #card,
    .status-badge,
    .focus-star,
    .progress-section,
    .corner-elements span {
      transition: none;
    }

    .tracker:hover ~ #card {
      transform: none;
    }

    #card::before,
    #card::after {
      filter: none;
    }
  }

  .noselect {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }
`;

export default BarViewGoalCard;
