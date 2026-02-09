import React, { useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { Star, Target, Zap, ImageOff, ArrowUpRight, Trophy } from "lucide-react";
import { getTagColor, getTagLabel, getStatusLabel } from "@/lib/goalConstants";

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
  const map: Record<string, { color: string; rgb: string }> = {
    easy: { color: "#4ade80", rgb: "74, 222, 128" },
    medium: { color: "#facc15", rgb: "250, 204, 21" },
    hard: { color: "#fb923c", rgb: "251, 146, 60" },
    extreme: { color: "#f87171", rgb: "248, 113, 113" },
    impossible: { color: "#c084fc", rgb: "192, 132, 252" },
  };
  if (difficulty === "custom") {
    const hex = (customColor || "#a855f7").replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 168;
    const g = parseInt(hex.substring(2, 4), 16) || 85;
    const b = parseInt(hex.substring(4, 6), 16) || 247;
    return { color: customColor || "#a855f7", rgb: `${r}, ${g}, ${b}` };
  }
  return map[difficulty] || { color: "#94a3b8", rgb: "148, 163, 184" };
};

export function GridViewGoalCard({
  goal,
  isCompleted = false,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
  onNavigate,
  onToggleFocus,
}: GridViewGoalCardProps) {
  const meta = useMemo(() => {
    const diff = goal.difficulty || "easy";
    const isHabit = goal.goal_type === "habit";
    const total = isHabit ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
    const completed = isHabit ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;
    const prog = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      difficulty: diff,
      isHabit,
      progress: prog,
      completed,
      total,
      theme: getDifficultyTheme(diff, customDifficultyColor),
      displayTags: goal.tags?.slice(0, 2) || [],
    };
  }, [goal, customDifficultyColor]);

  return (
    <CardWrapper
      $color={meta.theme.color}
      $rgb={meta.theme.rgb}
      $progress={meta.progress}
      onClick={() => onNavigate(goal.id)}
    >
      {/* Background Glow Effect */}
      <div className="glow-effect" />

      <div className="card-content">
        {/* Top: Image Section */}
        <div className="media-area">
          {goal.image_url ? (
            <img src={goal.image_url} alt="" loading="lazy" />
          ) : (
            <div className="placeholder">
              <ImageOff size={32} strokeWidth={1} />
            </div>
          )}

          <div className="media-badges">
            <div className="pill difficulty">
              <span className="dot" />
              {meta.difficulty === "custom" ? customDifficultyName : meta.difficulty}
            </div>

            <button
              className={`focus-btn ${goal.is_focus ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFocus(goal.id, !!goal.is_focus, e);
              }}
            >
              <Star size={14} fill={goal.is_focus ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        {/* Bottom: Info Section */}
        <div className="info-area">
          <div className="header-row">
            <div className="type-badge">
              {meta.isHabit ? <Zap size={12} /> : <Target size={12} />}
              {meta.isHabit ? "HABIT" : "GOAL"}
            </div>
            {isCompleted && (
              <div className="status-badge">
                <Trophy size={12} />
              </div>
            )}
          </div>

          <h3 className="goal-name">{goal.name}</h3>

          <div className="progress-container">
            <div className="progress-labels">
              <span className="percentage">{meta.progress}%</span>
              <span className="count">
                {meta.completed} / {meta.total}
              </span>
            </div>
            <div className="progress-bar">
              <div className="fill" />
            </div>
          </div>

          <div className="card-footer">
            <div className="tags-list">
              {meta.displayTags.map((t, i) => (
                <span key={i} className="tag">
                  #{getTagLabel(t)}
                </span>
              ))}
            </div>
            <div className="arrow-link">
              <ArrowUpRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}

// --- Styles ---

const shine = keyframes`
  0% { transform: translateX(-100%) skewX(-15deg); }
  30%, 100% { transform: translateX(200%) skewX(-15deg); }
`;

const CardWrapper = styled.div<{ $color: string; $rgb: string; $progress: number }>`
  --accent: ${(p) => p.$color};
  --accent-rgb: ${(p) => p.$rgb};
  
  position: relative;
  width: 100%;
  aspect-ratio: 0.8 / 1; /* Force une taille identique pour toutes les cartes */
  background: #0a0a0a;
  border-radius: 24px;
  cursor: pointer;
  isolation: isolate;
  transition: transform 0.4s cubic-bezier(0.2, 0, 0.2, 1);

  /* Effet de lueur derrière la carte */
  .glow-effect {
    position: absolute;
    inset: -1px;
    background: radial-gradient(circle at 50% 0%, rgba(var(--accent-rgb), 0.15), transparent 70%);
    border-radius: inherit;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .card-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: inherit;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 100%);
  }

  /* Media Area */
  .media-area {
    position: relative;
    height: 45%;
    background: #151515;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s ease;
    }

    .placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
    }

    .media-badges {
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 2;
    }

    .pill {
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      padding: 4px 10px;
      border-radius: 100px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: white;
      display: flex;
      align-items: center;
      gap: 6px;
      border: 1px solid rgba(255,255,255,0.1);

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--accent);
        box-shadow: 0 0 8px var(--accent);
      }
    }

    .focus-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.1);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &.active {
        background: var(--accent);
        color: black;
      }
    }
  }

  /* Info Area */
  .info-area {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .type-badge {
    font-size: 9px;
    font-weight: 900;
    color: var(--accent);
    display: flex;
    align-items: center;
    gap: 4px;
    letter-spacing: 1px;
  }

  .status-badge {
    color: var(--accent);
  }

  .goal-name {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Progress Section */
  .progress-container {
    margin-top: auto;

    .progress-labels {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 6px;

      .percentage {
        font-size: 1.4rem;
        font-weight: 800;
        color: #fff;
      }
      .count {
        font-size: 11px;
        color: #666;
        font-weight: 600;
      }
    }

    .progress-bar {
      height: 4px;
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
      overflow: hidden;

      .fill {
        height: 100%;
        width: ${(p) => p.$progress}%;
        background: var(--accent);
        border-radius: inherit;
        position: relative;
        transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);

        &::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: ${shine} 2s infinite linear;
        }
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.05);

    .tags-list {
      display: flex;
      gap: 8px;
      .tag {
        font-size: 10px;
        font-weight: 600;
        color: #555;
      }
    }

    .arrow-link {
      color: #333;
      transition: transform 0.3s, color 0.3s;
    }
  }

  /* Hover Effects */
  &:hover {
    transform: translateY(-6px);
    
    .glow-effect { opacity: 1; }
    
    .card-content {
      border-color: rgba(var(--accent-rgb), 0.4);
      background: linear-gradient(180deg, rgba(var(--accent-rgb), 0.05) 0%, rgba(0,0,0,0) 100%);
    }

    .media-area img { transform: scale(1.1); }

    .arrow-link {
      color: var(--accent);
      transform: translate(2px, -2px);
    }
  }
`;

export default GridViewGoalCard;
