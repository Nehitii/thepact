import { motion } from "framer-motion";
import { Star, Sparkles, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDifficultyColor as getUnifiedDifficultyColor } from "@/lib/utils";

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
}

interface BarViewGoalCardProps {
  goal: Goal;
  isCompleted?: boolean;
  customDifficultyName?: string;
  customDifficultyColor?: string;
  onNavigate: (goalId: string) => void;
  onToggleFocus: (goalId: string, currentFocus: boolean, e: React.MouseEvent) => void;
}

const getDifficultyLabel = (difficulty: string, customName?: string): string => {
  if (difficulty === "custom") return customName || "Custom";
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case "not_started":
      return "Not Started";
    case "in_progress":
      return "In Progress";
    case "fully_completed":
      return "Completed";
    case "paused":
      return "Paused";
    case "validated":
      return "Validated";
    default:
      return status || "Unknown";
  }
};

const getGoalTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    personal: "Personal",
    professional: "Professional",
    health: "Health",
    creative: "Creative",
    financial: "Financial",
    learning: "Learning",
    relationship: "Relationship",
    diy: "DIY",
    other: "Other",
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

const getDifficultyIntensity = (difficulty: string): number => {
  switch (difficulty) {
    case "easy": return 1;
    case "medium": return 2;
    case "hard": return 3;
    case "extreme": return 4;
    case "impossible":
    case "custom": return 5;
    default: return 1;
  }
};

// Convert HSL or hex to RGB for glow effects
const colorToRgb = (color: string): { r: number; g: number; b: number } => {
  if (color.startsWith("hsl(")) {
    const match = color.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
    if (match) {
      const h = parseInt(match[1]) / 360;
      const s = parseInt(match[2]) / 100;
      const l = parseInt(match[3]) / 100;
      
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }
  }
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const full = hex.length === 3 ? hex.split("").map(c => c + c).join("") : hex;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }
  return { r: 92, g: 103, b: 255 }; // default
};

// Shift hue for secondary glow color
const getSecondaryGlowColor = (color: string): string => {
  if (color.startsWith("hsl(")) {
    const match = color.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
    if (match) {
      const h = (parseInt(match[1]) + 60) % 360;
      const s = parseInt(match[2]);
      const l = parseInt(match[3]);
      return `hsl(${h} ${s}% ${l}%)`;
    }
  }
  return "#00ffaa";
};

export function BarViewGoalCard({
  goal,
  isCompleted = false,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
  onNavigate,
  onToggleFocus,
}: BarViewGoalCardProps) {
  const difficulty = goal.difficulty || "easy";
  const difficultyColor = difficulty === "custom" ? customDifficultyColor : getUnifiedDifficultyColor(difficulty);
  const secondaryColor = getSecondaryGlowColor(difficultyColor);
  const rgb = colorToRgb(difficultyColor);
  const rgb2 = colorToRgb(secondaryColor);

  const goalType = goal.goal_type || "standard";
  const isHabitGoal = goalType === "habit";
  const totalSteps = isHabitGoal ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
  const completedSteps = isHabitGoal ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const tagLabel = getGoalTypeLabel(goal.type);
  const intensity = getDifficultyIntensity(difficulty);
  const cardId = `bar-card-${goal.id.slice(0, 8)}`;

  return (
    <div
      className={`${cardId} bar-goal-card noselect`}
      onClick={() => onNavigate(goal.id)}
    >
      {/* 5x5 Grid for 3D tilt tracking */}
      <div className="canvas">
        {Array.from({ length: 25 }, (_, i) => (
          <div key={i} className={`tracker tr-${i + 1}`} />
        ))}
      </div>

      {/* Main Card */}
      <div id="card" className={`${cardId}-card`}>
        {/* Glare overlay */}
        <div className="card-glare" />

        {/* Scan line effect */}
        <div className="scan-line" />

        {/* Corner elements */}
        <div className="corner-elements">
          <span style={{ borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)` }} />
          <span style={{ borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)` }} />
          <span style={{ borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)` }} />
          <span style={{ borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)` }} />
        </div>

        {/* Cyber lines */}
        <div className="cyber-lines">
          <span style={{ background: `linear-gradient(90deg, transparent, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2), transparent)` }} />
          <span style={{ background: `linear-gradient(90deg, transparent, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2), transparent)` }} />
          <span style={{ background: `linear-gradient(90deg, transparent, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2), transparent)` }} />
          <span style={{ background: `linear-gradient(90deg, transparent, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2), transparent)` }} />
        </div>

        {/* Glowing elements */}
        <div className="glowing-elements">
          <div className="glow-1" style={{ background: `radial-gradient(circle at center, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) 0%, transparent 70%)` }} />
          <div className="glow-2" style={{ background: `radial-gradient(circle at center, rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.3) 0%, transparent 70%)` }} />
          <div className="glow-3" style={{ background: `radial-gradient(circle at center, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) 0%, transparent 70%)` }} />
        </div>

        {/* Particles */}
        <div className="card-particles">
          <span style={{ background: difficultyColor }} />
          <span style={{ background: secondaryColor }} />
          <span style={{ background: difficultyColor }} />
          <span style={{ background: secondaryColor }} />
          <span style={{ background: difficultyColor }} />
          <span style={{ background: secondaryColor }} />
        </div>

        {/* Card Content */}
        <div className="card-content">
          {/* Focus Star Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFocus(goal.id, goal.is_focus || false, e);
            }}
            className="focus-star-btn"
          >
            <Star className={`h-4 w-4 ${goal.is_focus ? "fill-yellow-500 text-yellow-500" : "text-slate-400"}`} />
          </button>

          {/* Image / Avatar */}
          <div className="goal-avatar">
            {goal.image_url ? (
              <img
                src={goal.image_url}
                alt={goal.name}
                className={isCompleted ? "grayscale opacity-70" : ""}
              />
            ) : (
              <div className="avatar-placeholder" style={{ background: `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1))` }}>
                <Trophy className="h-7 w-7" style={{ color: difficultyColor }} />
              </div>
            )}
          </div>

          {/* Title - shown on hover */}
          <h3 className="title font-orbitron" style={{
            background: `linear-gradient(45deg, ${difficultyColor}, ${secondaryColor})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: `drop-shadow(0 0 15px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3))`,
          }}>
            {goal.name}
          </h3>

          {/* Subtitle with steps and difficulty */}
          <p className="subtitle font-rajdhani">
            <span>{completedSteps}/{totalSteps} {isHabitGoal ? "Days" : "Steps"}</span>
            <span className="highlight" style={{
              background: `linear-gradient(90deg, ${difficultyColor}, ${secondaryColor})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {getDifficultyLabel(difficulty, customDifficultyName)}
            </span>
          </p>

          {/* Progress bar */}
          <div className="progress-container">
            <motion.div 
              className="progress-bar"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ background: `linear-gradient(90deg, ${difficultyColor}, ${secondaryColor})` }}
            />
          </div>

          {/* Tags and Status row */}
          <div className="meta-row">
            <span className="tag-badge font-rajdhani" style={{ 
              borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`,
              color: difficultyColor,
            }}>
              {tagLabel}
            </span>
            <span className="status-badge font-rajdhani" style={{
              background: isCompleted || goal.status === "fully_completed" 
                ? "rgba(52, 199, 89, 0.2)" 
                : goal.status === "in_progress" 
                  ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)` 
                  : "rgba(245, 166, 35, 0.2)",
              color: isCompleted || goal.status === "fully_completed" 
                ? "#34c759" 
                : goal.status === "in_progress" 
                  ? difficultyColor 
                  : "#f5a623",
            }}>
              {getStatusLabel(goal.status || "in_progress")}
            </span>
          </div>

          {/* XP indicator */}
          {goal.potential_score && goal.potential_score > 0 && (
            <div className="xp-badge" style={{ borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)` }}>
              <Sparkles className="h-3.5 w-3.5" style={{ color: difficultyColor }} />
              <span className="font-rajdhani" style={{ color: difficultyColor }}>+{goal.potential_score} XP</span>
            </div>
          )}

          {/* Difficulty Badge */}
          <Badge
            className="difficulty-badge"
            style={{
              background: `linear-gradient(135deg, ${difficultyColor}, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7))`,
              border: `1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`,
              boxShadow: `0 0 ${8 + intensity * 3}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
            }}
          >
            <span className="badge-shine" />
            <span className="relative z-10">{getDifficultyLabel(difficulty, customDifficultyName)}</span>
          </Badge>
        </div>
      </div>

      {/* Scoped CSS for hover effects with difficulty colors */}
      <style>{`
        .${cardId}-card:hover .corner-elements span {
          border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8) !important;
          box-shadow: 0 0 10px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5);
        }
        .${cardId}-card::before {
          background: radial-gradient(
            circle at center,
            rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) 0%,
            rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.05) 50%,
            transparent 100%
          ) !important;
        }
      `}</style>
    </div>
  );
}
