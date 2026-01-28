import React, { useState } from "react";
import { Star, Target, Zap } from "lucide-react";
import { getTagColor, getTagLabel, getStatusLabel } from "@/lib/goalConstants";

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
  customDifficultyColor,
  onNavigate,
  onToggleFocus,
}: GridViewGoalCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const difficulty = goal.difficulty || "easy";
  const goalType = goal.goal_type || "standard";
  const isHabitGoal = goalType === "habit";
  
  const totalSteps = isHabitGoal ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
  const completedSteps = isHabitGoal ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const theme = getDifficultyTheme(difficulty, customDifficultyColor);
  const statusLabel = isCompleted ? "Completed" : getStatusLabel(goal.status || "not_started");
  
  // Get tags to display
  const displayTags = goal.tags?.slice(0, 2) || (goal.type ? [goal.type] : []);
  const remainingTagsCount = (goal.tags?.length || 0) - 2;

  const cardId = `uiverse-card-${goal.id}`;

  return (
    <div
      className="uiverse-card-wrapper group cursor-pointer"
      onClick={() => onNavigate(goal.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style>{`
        #${cardId} {
          --accent-color: ${theme.color};
          --accent-rgb: ${theme.rgb};
        }
        
        #${cardId} .uiverse-card {
          width: 300px;
          height: 300px;
          background: #243137;
          position: relative;
          display: flex;
          flex-direction: column;
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.5s ease-in-out;
        }
        
        #${cardId} .uiverse-border {
          position: absolute;
          inset: 0px;
          border: 2px solid var(--accent-color);
          opacity: 0;
          transform: rotate(10deg);
          transition: all 0.5s ease-in-out;
          pointer-events: none;
          border-radius: 10px;
        }
        
        #${cardId} .uiverse-bottom-text {
          position: absolute;
          left: 50%;
          bottom: 13px;
          transform: translateX(-50%);
          font-size: 10px;
          text-transform: uppercase;
          padding: 0px 5px 0px 8px;
          color: var(--accent-color);
          background: #243137;
          opacity: 0;
          letter-spacing: 7px;
          transition: all 0.5s ease-in-out;
          white-space: nowrap;
          z-index: 20;
        }
        
        #${cardId} .uiverse-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          transition: all 0.5s ease-in-out;
          z-index: 5;
          opacity: 0;
          pointer-events: none;
        }
        
        #${cardId} .uiverse-logo {
          height: 50px;
          position: relative;
          width: 50px;
          overflow: hidden;
          transition: all 1s ease-in-out;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        #${cardId} .uiverse-logo svg {
          height: 100%;
          width: 100%;
        }
        
        #${cardId} .uiverse-logo-text {
          margin-top: 20px;
          color: var(--accent-color);
          font-size: 14px;
          font-weight: 600;
          opacity: 0;
          letter-spacing: 0;
          transition: all 0.5s ease-in-out 0.3s;
          text-align: center;
          max-width: 220px;
          line-height: 1.3;
        }
        
        #${cardId} .uiverse-trail {
          position: absolute;
          right: 0;
          height: 100%;
          width: 100%;
          opacity: 0;
        }
        
        #${cardId}:hover .uiverse-card {
          border-radius: 0;
          transform: scale(1.1);
        }
        
        #${cardId}:hover .uiverse-logo {
          width: 60px;
          animation: uiverse-opacity-${goal.id.slice(0,8)} 1s ease-in-out;
        }
        
        #${cardId}:hover .uiverse-border {
          inset: 15px;
          opacity: 1;
          transform: rotate(0);
        }
        
        #${cardId}:hover .uiverse-bottom-text {
          letter-spacing: 3px;
          opacity: 1;
        }
        
        #${cardId}:hover .uiverse-logo-text {
          opacity: 1;
          letter-spacing: 2px;
        }
        
        #${cardId}:hover .uiverse-trail {
          animation: uiverse-trail-${goal.id.slice(0,8)} 1s ease-in-out;
        }
        
        #${cardId}:hover .uiverse-info-panel {
          opacity: 0;
          transform: translateY(-10px);
          pointer-events: none;
        }
        
        #${cardId}:hover .uiverse-content {
          opacity: 1;
          pointer-events: auto;
        }
        
        @keyframes uiverse-opacity-${goal.id.slice(0,8)} {
          0% { border-right: 1px solid transparent; }
          10% { border-right: 1px solid var(--accent-color); }
          80% { border-right: 1px solid var(--accent-color); }
          100% { border-right: 1px solid transparent; }
        }
        
        @keyframes uiverse-trail-${goal.id.slice(0,8)} {
          0% {
            background: linear-gradient(90deg, rgba(var(--accent-rgb), 0) 90%, rgb(var(--accent-rgb)) 100%);
            opacity: 0;
          }
          30% {
            background: linear-gradient(90deg, rgba(var(--accent-rgb), 0) 70%, rgb(var(--accent-rgb)) 100%);
            opacity: 1;
          }
          70% {
            background: linear-gradient(90deg, rgba(var(--accent-rgb), 0) 70%, rgb(var(--accent-rgb)) 100%);
            opacity: 1;
          }
          95% {
            background: linear-gradient(90deg, rgba(var(--accent-rgb), 0) 90%, rgb(var(--accent-rgb)) 100%);
            opacity: 0;
          }
        }
      `}</style>

      <div id={cardId}>
        <div className="uiverse-card">
          {/* Animated border */}
          <div className="uiverse-border" />
          
          {/* Info panel - visible by default, fades on hover */}
          <div className="uiverse-info-panel absolute inset-0 p-4 flex flex-col transition-all duration-300 z-10">
            {/* Top row: Focus star + Difficulty badge */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFocus(goal.id, !!goal.is_focus, e);
                }}
                className="p-1.5 rounded-full transition-all duration-200 hover:scale-110"
                style={{
                  background: goal.is_focus ? `rgba(${theme.rgb}, 0.2)` : "rgba(255,255,255,0.1)",
                }}
              >
                <Star
                  className="w-4 h-4 transition-colors"
                  style={{
                    color: goal.is_focus ? theme.color : "#9ca3af",
                    fill: goal.is_focus ? theme.color : "transparent",
                  }}
                />
              </button>
              
              <span
                className="px-2.5 py-1 text-xs font-semibold rounded uppercase tracking-wide"
                style={{
                  background: `rgba(${theme.rgb}, 0.2)`,
                  color: theme.color,
                  border: `1px solid rgba(${theme.rgb}, 0.4)`,
                }}
              >
                {getDifficultyLabel(difficulty, customDifficultyName)}
              </span>
            </div>
            
            {/* Goal name */}
            <h3 
              className="text-base font-bold mb-2 line-clamp-2 leading-tight"
              style={{ color: theme.color }}
            >
              {goal.name}
            </h3>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {displayTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[10px] font-medium rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: getTagColor(tag),
                    border: `1px solid rgba(255,255,255,0.15)`,
                  }}
                >
                  {getTagLabel(tag)}
                </span>
              ))}
              {remainingTagsCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-white/5 text-gray-400">
                  +{remainingTagsCount}
                </span>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400">Progress</span>
                <span 
                  className="text-xs font-bold"
                  style={{ color: theme.color }}
                >
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, rgba(${theme.rgb}, 0.6), ${theme.color})`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-500">
                  {completedSteps}/{totalSteps} {isHabitGoal ? "days" : "steps"}
                </span>
                <span 
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: statusLabel === "Completed" ? "#22c55e" : "#9ca3af",
                  }}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
          
          {/* Center content - visible on hover */}
          <div className="uiverse-content">
            <div className="uiverse-logo">
              {isHabitGoal ? (
                <Zap style={{ fill: theme.color, color: theme.color }} />
              ) : (
                <Target style={{ fill: "none", stroke: theme.color, strokeWidth: 1.5 }} />
              )}
              <div className="uiverse-trail" />
            </div>
            <div className="uiverse-logo-text">{goal.name}</div>
          </div>
          
          {/* Bottom text */}
          <div className="uiverse-bottom-text">
            {isHabitGoal ? "habit goal" : "goal"}
          </div>
        </div>
      </div>
    </div>
  );
}
