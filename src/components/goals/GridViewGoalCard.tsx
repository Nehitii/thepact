import React, { useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { Star, Target, Zap, ImageOff, ArrowRight, Award } from "lucide-react";
import { getTagColor, getTagLabel, getStatusLabel, getDifficultyIntensity } from "@/lib/goalConstants";

// --- Types ---
// (Gardé identique à ton interface initiale)
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

// --- Helpers de couleurs ---
const getDifficultyTheme = (difficulty: string, customColor?: string) => {
  const themes: Record<string, { color: string; rgb: string }> = {
    easy: { color: "#22c55e", rgb: "34, 197, 94" },
    medium: { color: "#eab308", rgb: "234, 179, 8" },
    hard: { color: "#f97316", rgb: "249, 115, 22" },
    extreme: { color: "#ef4444", rgb: "239, 68, 68" },
    impossible: { color: "#a855f7", rgb: "168, 85, 247" },
  };
  if (difficulty === "custom") {
    const hex = (customColor || "#a855f7").replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 168;
    const g = parseInt(hex.substring(2, 4), 16) || 85;
    const b = parseInt(hex.substring(4, 6), 16) || 247;
    return { color: customColor || "#a855f7", rgb: `${r}, ${g}, ${b}` };
  }
  return themes[difficulty] || { color: "#94a3b8", rgb: "148, 163, 184" };
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
      isHabitGoal: isHabit,
      progress: prog,
      completed,
      total,
      theme: getDifficultyTheme(diff, customDifficultyColor),
      displayTags: goal.tags?.slice(0, 2) || [],
    };
  }, [goal, customDifficultyColor]);

  return (
    <CardContainer
      $accent={meta.theme.color}
      $accentRgb={meta.theme.rgb}
      $progress={meta.progress}
      onClick={() => onNavigate(goal.id)}
    >
      <div className="visual-anchor">
        {/* Background Layer */}
        <div className="bg-container">
          {goal.image_url ? (
            <img src={goal.image_url} alt="" className="main-image" />
          ) : (
            <div className="image-placeholder">
              <Target size={40} />
            </div>
          )}
          <div className="overlay-gradient" />
        </div>

        {/* Content Top */}
        <div className="card-header">
          <div className="badge-group">
            <span className="difficulty-tag">
              <span className="glow-dot" />
              {meta.difficulty === "custom" ? customDifficultyName : meta.difficulty}
            </span>
            {isCompleted && (
              <span className="completed-badge">
                <Award size={12} /> Done
              </span>
            )}
          </div>

          <button
            className={`focus-trigger ${goal.is_focus ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFocus(goal.id, !!goal.is_focus, e);
            }}
          >
            <Star size={16} fill={goal.is_focus ? "currentColor" : "transparent"} />
          </button>
        </div>

        {/* Content Bottom */}
        <div className="card-body">
          <div className="type-icon">{meta.isHabitGoal ? <Zap size={14} /> : <Target size={14} />}</div>

          <h3 className="goal-title">{goal.name}</h3>

          <div className="progress-section">
            <div className="progress-info">
              <span className="percent">{meta.progress}%</span>
              <span className="metrics">
                {meta.completed} / {meta.total}
              </span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" />
            </div>
          </div>

          <div className="footer-reveal">
            <div className="tags">
              {meta.displayTags.map((tag, i) => (
                <span key={i} className="tag">
                  #{getTagLabel(tag)}
                </span>
              ))}
            </div>
            <div className="action-hint">
              View Details <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </CardContainer>
  );
}

// --- Styles ---

const shine = keyframes`
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  80% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
`;

const CardContainer = styled.div<{ $accent: string; $accentRgb: string; $progress: number }>`
  --accent: ${(props) => props.$accent};
  --accent-rgb: ${(props) => props.$accentRgb};
  
  position: relative;
  width: 100%;
  aspect-ratio: 0.82;
  border-radius: 24px;
  background: #0f1115;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);

  .visual-anchor {
    position: relative;
    height: 100%;
    width: 100%;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px;
  }

  /* Image & Background */
  .bg-container {
    position: absolute;
    inset: 0;
    z-index: -1;
    
    .main-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.8s ease;
      filter: saturate(0.8) brightness(0.9);
    }

    .image-placeholder {
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 20% 20%, #1a1c23, #08090a);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.05);
    }

    .overlay-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        rgba(15, 17, 21, 0.2) 0%,
        rgba(15, 17, 21, 0.6) 50%,
        rgba(15, 17, 21, 0.95) 100%
      );
    }
  }

  /* Header Styles */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .badge-group {
      display: flex;
      gap: 8px;
    }

    .difficulty-tag {
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(12px);
      padding: 6px 12px;
      border-radius: 100px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      gap: 6px;

      .glow-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--accent);
        box-shadow: 0 0 10px var(--accent);
      }
    }

    .completed-badge {
      background: var(--accent);
      color: #000;
      padding: 6px 10px;
      border-radius: 100px;
      font-size: 10px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .focus-trigger {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      transform: translateY(-2px);
    }

    &.active {
      background: var(--accent);
      color: #000;
      border-color: var(--accent);
    }
  }

  /* Body Styles */
  .card-body {
    .type-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: rgba(var(--accent-rgb), 0.2);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }

    .goal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 16px 0;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  /* Progress Section */
  .progress-section {
    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 8px;

      .percent {
        font-size: 18px;
        font-weight: 800;
        color: #fff;
        font-variant-numeric: tabular-nums;
      }
      
      .metrics {
        font-size: 11px;
        color: rgba(255,255,255,0.4);
        font-weight: 600;
      }
    }

    .bar-track {
      height: 6px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      overflow: hidden;
      position: relative;

      .bar-fill {
        height: 100%;
        width: ${(props) => props.$progress}%;
        background: linear-gradient(90deg, var(--accent), #fff);
        border-radius: 10px;
        transition: width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: ${shine} 3s infinite;
        }
      }
    }
  }

  /* Hover Reveal Area */
  .footer-reveal {
    height: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.4s ease;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0;

    .tags {
      display: flex;
      gap: 6px;
      .tag {
        font-size: 10px;
        color: var(--accent);
        font-weight: 600;
      }
    }

    .action-hint {
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  /* Global Hover Effects */
  &:hover {
    transform: translateY(-8px) scale(1.01);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 
                0 0 20px rgba(var(--accent-rgb), 0.1);
    border-color: rgba(var(--accent-rgb), 0.3);

    .main-image {
      transform: scale(1.1);
    }

    .footer-reveal {
      height: 30px;
      opacity: 1;
      margin-top: 16px;
    }
    
    .overlay-gradient {
      background: linear-gradient(
        to bottom,
        rgba(var(--accent-rgb), 0.1) 0%,
        rgba(15, 17, 21, 0.7) 40%,
        rgba(15, 17, 21, 1) 100%
      );
    }
  }
`;

export default GridViewGoalCard;
