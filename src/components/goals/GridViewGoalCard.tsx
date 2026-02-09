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
      <div className="card-inner">
        {/* 1. MEDIA SECTION (Hauteur Fixe) */}
        <div className="media-box">
          {goal.image_url ? (
            <img src={goal.image_url} alt="" />
          ) : (
            <div className="empty-media">
              <ImageOff size={24} />
            </div>
          )}
          <div className="badges-overlay">
            <div className="diff-pill">
              <span className="dot" />
              {meta.difficulty === "custom" ? customDifficultyName : meta.difficulty}
            </div>
            <button
              className={`fav-btn ${goal.is_focus ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFocus(goal.id, !!goal.is_focus, e);
              }}
            >
              <Star size={14} fill={goal.is_focus ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        {/* 2. INFO SECTION (Prend le reste de l'espace) */}
        <div className="content-box">
          <div className="top-meta">
            <span className="type-label">
              {meta.isHabit ? <Zap size={10} /> : <Target size={10} />}
              {meta.isHabit ? "HABIT" : "GOAL"}
            </span>
            {isCompleted && <Trophy size={14} className="trophy" />}
          </div>

          <h3 className="goal-title">{goal.name}</h3>

          {/* 3. PROGRESS SECTION (Poussée vers le bas) */}
          <div className="bottom-meta">
            <div className="prog-text">
              <span className="percent">{meta.progress}%</span>
              <span className="fraction">
                {meta.completed}/{meta.total}
              </span>
            </div>
            <div className="prog-bar-track">
              <div className="prog-bar-fill" />
            </div>
            <div className="footer-row">
              <div className="tags">
                {meta.displayTags.map((t, i) => (
                  <span key={i}>#{getTagLabel(t)}</span>
                ))}
              </div>
              <ArrowUpRight size={14} className="arrow" />
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}

// --- CSS ---

const shine = keyframes`
  0% { transform: translateX(-100%) skewX(-15deg); }
  40%, 100% { transform: translateX(250%) skewX(-15deg); }
`;

const CardWrapper = styled.div<{ $color: string; $rgb: string; $progress: number }>`
  --accent: ${(p) => p.$color};
  --accent-rgb: ${(p) => p.$rgb};
  
  width: 100%;
  /* LE FIX : On impose un ratio pour que toutes les cartes soient IDENTIQUES */
  aspect-ratio: 0.85 / 1; 
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }

  .card-inner {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #0d0d0d;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
    position: relative;
  }

  /* Partie Image - Hauteur rigide */
  .media-box {
    position: relative;
    height: 42%; 
    width: 100%;
    background: #141414;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.8;
      transition: transform 0.5s ease;
    }

    .empty-media {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #222;
    }
  }

  .badges-overlay {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .diff-pill {
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(10px);
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    color: #fff;
    border: 1px solid rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    gap: 6px;

    .dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent);
    }
  }

  .fav-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &.active {
      background: var(--accent);
      color: #000;
      border-color: var(--accent);
    }
  }

  /* Contenu textuel - Flex auto-ajusté */
  .content-box {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;
  }

  .top-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    .type-label {
      font-size: 9px;
      font-weight: 900;
      color: var(--accent);
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .trophy { color: var(--accent); }
  }

  .goal-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
    line-height: 1.2;
    /* On limite à 2 lignes pour garder l'alignement */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Bloc progrès poussé au fond */
  .bottom-meta {
    margin-top: auto; 
    padding-top: 12px;

    .prog-text {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 6px;
      .percent { font-size: 1.3rem; font-weight: 850; color: #fff; }
      .fraction { font-size: 10px; color: #444; font-weight: 600; }
    }

    .prog-bar-track {
      height: 4px;
      background: rgba(255,255,255,0.03);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 12px;

      .prog-bar-fill {
        height: 100%;
        width: ${(p) => p.$progress}%;
        background: var(--accent);
        position: relative;
        transition: width 0.8s ease;

        &::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: ${shine} 2s infinite linear;
        }
      }
    }
  }

  .footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .tags {
      display: flex;
      gap: 8px;
      font-size: 10px;
      color: #333;
      font-weight: 600;
    }
    .arrow { color: #222; transition: 0.2s; }
  }

  &:hover {
    .media-box img { transform: scale(1.05); opacity: 1; }
    .card-inner { border-color: rgba(var(--accent-rgb), 0.3); }
    .footer-row .arrow { color: var(--accent); transform: translate(2px, -2px); }
  }
`;

export default GridViewGoalCard;
