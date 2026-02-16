import React, { memo, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { Star, Target, Trophy, TrendingUp } from "lucide-react";
import { DIFFICULTY_OPTIONS, getStatusLabel, getDifficultyIntensity } from "@/lib/goalConstants";

// --- Types (inchangés) ---
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

// --- Helpers (inchangés mais optimisés) ---
const getDifficultyTheme = (difficulty: string, customColor?: string) => {
  switch (difficulty) {
    case "easy":
      return { color: "#22c55e", rgb: "34, 197, 94" }; // Plus vibrant
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

// --- Component ---

export const BarViewGoalCard = memo(function BarViewGoalCard({
  goal,
  isCompleted = false,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
  onNavigate,
  onToggleFocus,
}: BarViewGoalCardProps) {
  const { theme, difficultyLabel, progressPercent, statusLabel, totalSteps, completedSteps, intensity } =
    useMemo(() => {
      const diff = goal.difficulty || "easy";
      const total = goal.totalStepsCount || 0;
      const completed = goal.completedStepsCount || 0;

      return {
        theme: getDifficultyTheme(diff, customDifficultyColor),
        difficultyLabel: getDifficultyDisplayLabel(diff, customDifficultyName),
        progressPercent: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0,
        statusLabel: isCompleted ? "Completed" : getStatusLabel(goal.status || "not_started"),
        totalSteps: total,
        completedSteps: completed,
        intensity: getDifficultyIntensity(diff),
      };
    }, [goal, isCompleted, customDifficultyName, customDifficultyColor]);

  return (
    <StyledWrapper
      $accentColor={theme.color}
      $accentRgb={theme.rgb}
      $intensity={intensity}
      $percent={progressPercent}
      onClick={() => onNavigate(goal.id)}
    >
      <div className="container noselect">
        {/* Grille de détection pour l'effet 3D */}
        <div className="canvas">
          {[...Array(9)].map((_, i) => (
            <div key={i} className={`tracker tr-${i + 1}`} />
          ))}

          <div id="card">
            {/* Texture de bruit subtile pour le réalisme */}
            <div className="noise-overlay" />

            <div className="card-content">
              {/* Image Section */}
              <div className="visual-container">
                <div className="image-glow" />
                <div className="image-frame">
                  {goal.image_url ? (
                    <img src={goal.image_url} alt={goal.name} loading="lazy" />
                  ) : (
                    <div className="placeholder">
                      <Target size={24} />
                    </div>
                  )}
                </div>
                {/* Petit badge circulaire de progression sur l'image */}
                {totalSteps > 0 && (
                  <div
                    className="mini-progress-ring"
                    style={{
                      background: `conic-gradient(${theme.color} ${progressPercent}%, rgba(255,255,255,0.1) 0)`,
                    }}
                  >
                    <div className="inner-circle">
                      {isCompleted ? <Trophy size={10} color={theme.color} /> : <TrendingUp size={10} color="white" />}
                    </div>
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="info-section">
                <div className="header-row">
                  <div className="difficulty-tag">
                    <span className="dot" />
                    {difficultyLabel}
                  </div>

                  {/* Bouton Favoris toujours visible mais dimmed */}
                  <button
                    className={`focus-btn ${goal.is_focus ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFocus(goal.id, !!goal.is_focus, e);
                    }}
                  >
                    <Star className="star-icon" size={14} fill={goal.is_focus ? theme.color : "none"} />
                  </button>
                </div>

                <h3 className="goal-name">{goal.name}</h3>

                <div className="meta-row">
                  <div className="status-text">{statusLabel}</div>
                  {totalSteps > 0 && (
                    <div className="steps-text">
                      {completedSteps} <span className="separator">/</span> {totalSteps}
                    </div>
                  )}
                </div>

                {/* Progress Bar intégrée */}
                <div className="progress-container">
                  <div className="progress-track">
                    <div className="progress-fill" />
                    <div className="progress-glow" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
});

// --- Styles ---

const shine = keyframes`
  0% { transform: translateX(-100%) rotate(25deg); }
  20%, 100% { transform: translateX(200%) rotate(25deg); }
`;

const StyledWrapper = styled.div<{ $accentColor: string; $accentRgb: string; $intensity: number; $percent: number }>`
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 8px; /* Un peu moins de padding pour resserrer */
  contain: layout style;

  .container {
    position: relative;
    width: 100%;
    max-width: 680px;
    height: 120px; /* Hauteur réduite pour un look plus "card" et moins "bloc" */
    cursor: pointer;
    perspective: 1000px;
  }

  .canvas {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    z-index: 10;
  }

  .tracker { z-index: 50; }

  #card {
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: 20px;
    background: linear-gradient(145deg, #1e1e1e, #131313);
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.1); /* Highlight top */
  }

  .noise-overlay {
    position: absolute;
    inset: 0;
    opacity: 0.03;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    z-index: 0;
  }

  /* --- Glassmorphism Glows --- */
  #card::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(${(props) => props.$accentRgb}, ${(props) => 0.05 + props.$intensity * 0.02}) 0%,
      transparent 60%
    );
    opacity: 0.6;
    pointer-events: none;
    z-index: 0;
  }

  .card-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    padding: 14px 18px;
    gap: 18px;
    height: 100%;
  }

  /* --- Image Section --- */
  .visual-container {
    position: relative;
    width: 76px;
    height: 76px;
    flex-shrink: 0;
  }

  .image-glow {
    position: absolute;
    inset: 4px;
    border-radius: 16px;
    background: ${(props) => props.$accentColor};
    filter: blur(15px);
    opacity: ${(props) => 0.2 + props.$intensity * 0.1};
    transition: opacity 0.3s ease;
  }

  .image-frame {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 18px;
    overflow: hidden;
    background: #000;
    border: 2px solid rgba(${(props) => props.$accentRgb}, 0.2);
    box-shadow: 0 8px 16px rgba(0,0,0,0.3);
    z-index: 2;
  }

  .image-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(${(props) => props.$accentRgb}, 0.15), rgba(0,0,0,0.4));
    color: ${(props) => props.$accentColor};
  }

  .mini-progress-ring {
    position: absolute;
    bottom: -6px;
    right: -6px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.5);
    border: 2px solid #1a1a1a;
  }

  .inner-circle {
    width: 16px;
    height: 16px;
    background: #222;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* --- Info Section --- */
  .info-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0; /* Fix flex text overflow */
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .difficulty-tag {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${(props) => props.$accentColor};
    background: rgba(${(props) => props.$accentRgb}, 0.1);
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid rgba(${(props) => props.$accentRgb}, 0.15);
  }

  .difficulty-tag .dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 6px currentColor;
  }

  .focus-btn {
    position: relative;
    z-index: 60;
    background: transparent;
    border: none;
    padding: 6px;
    margin: -6px;
    cursor: pointer;
    opacity: 0.3;
    transition: all 0.2s;
    transform: scale(0.9);
  }

  .focus-btn:hover, .focus-btn.active {
    opacity: 1;
    transform: scale(1.1);
  }
  
  .focus-btn.active .star-icon {
    filter: drop-shadow(0 0 8px ${(props) => props.$accentColor});
  }

  .goal-name {
    font-size: 16px;
    font-weight: 600;
    color: #f1f5f9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 6px;
    letter-spacing: -0.01em;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-size: 11px;
    color: #94a3b8;
    margin-bottom: 6px;
  }

  .status-text {
    font-weight: 500;
    text-transform: capitalize;
  }

  .steps-text {
    font-family: monospace; /* Pour aligner les chiffres joliment */
    opacity: 0.8;
  }
  
  .separator { color: #475569; }

  /* --- Progress Bar --- */
  .progress-container {
    position: relative;
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-track {
    height: 100%;
    width: ${(props) => props.$percent}%;
    position: relative;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .progress-fill {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, ${(props) => props.$accentColor}, #fff);
    opacity: 0.8;
  }

  .progress-glow {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
    transform: translateX(-100%);
    animation: ${shine} 2.5s infinite;
    opacity: 0.3;
  }

  /* --- 3D Interactions --- */
  
  /* Rotation subtile pour un effet premium (moins "jouet") */
  .tr-1:hover ~ #card { transform: rotateX(5deg) rotateY(-5deg); }
  .tr-2:hover ~ #card { transform: rotateX(5deg) rotateY(0deg); }
  .tr-3:hover ~ #card { transform: rotateX(5deg) rotateY(5deg); }
  .tr-4:hover ~ #card { transform: rotateX(0deg) rotateY(-5deg); }
  .tr-5:hover ~ #card { transform: rotateX(0deg) rotateY(0deg); }
  .tr-6:hover ~ #card { transform: rotateX(0deg) rotateY(5deg); }
  .tr-7:hover ~ #card { transform: rotateX(-5deg) rotateY(-5deg); }
  .tr-8:hover ~ #card { transform: rotateX(-5deg) rotateY(0deg); }
  .tr-9:hover ~ #card { transform: rotateX(-5deg) rotateY(5deg); }

  /* Global Hover Effects */
  .tracker:hover ~ #card {
    border-color: rgba(${(props) => props.$accentRgb}, 0.5);
    box-shadow: 
      0 15px 35px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(${(props) => props.$accentRgb}, 0.3); /* Inner glow effect */
  }

  .tracker:hover ~ #card .image-frame img {
    transform: scale(1.1); /* Zoom doux sur l'image */
  }

  .tracker:hover ~ #card .image-glow {
    opacity: ${(props) => 0.6 + props.$intensity * 0.1};
    filter: blur(20px);
  }

  .tracker:hover ~ #card .progress-fill {
    opacity: 1;
  }
`;

export default BarViewGoalCard;
