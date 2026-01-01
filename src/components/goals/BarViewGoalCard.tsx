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

const getGoalTypeTags = (type: string): string[] => {
  const typeMap: Record<string, string[]> = {
    personal: ["Personal", "Growth"],
    professional: ["Career", "Work"],
    health: ["Health", "Wellness"],
    creative: ["Creative", "Art"],
    financial: ["Finance", "Money"],
    learning: ["Learning", "Skills"],
    relationship: ["Social", "Connection"],
    diy: ["DIY", "Craft"],
    other: ["General"],
  };
  return typeMap[type] || [type.charAt(0).toUpperCase() + type.slice(1)];
};

const getDifficultyIntensity = (difficulty: string): number => {
  switch (difficulty) {
    case "easy":
      return 1;
    case "medium":
      return 2;
    case "hard":
      return 3;
    case "extreme":
      return 4;
    case "impossible":
    case "custom":
      return 5;
    default:
      return 1;
  }
};

const withAlpha = (color: string, alpha: number): string => {
  if (color.startsWith("hsl(")) {
    const inner = color.slice(4, -1).trim();
    const base = inner.split("/")[0].trim();
    return `hsl(${base} / ${alpha})`;
  }
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    if (full.length === 6) {
      const r = parseInt(full.slice(0, 2), 16);
      const g = parseInt(full.slice(2, 4), 16);
      const b = parseInt(full.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return color;
};

// Helper to adjust color brightness (works with hex)
const adjustColorBrightness = (color: string, amount: number): string => {
  if (color.startsWith("hsl(")) {
    const match = color.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
    if (match) {
      const h = parseInt(match[1]);
      const s = parseInt(match[2]);
      const l = Math.max(0, Math.min(100, parseInt(match[3]) + amount));
      return `hsl(${h} ${s}% ${l}%)`;
    }
    return color;
  }

  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    const r = Math.max(0, Math.min(255, parseInt(full.slice(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(full.slice(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(full.slice(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  return color;
};

// Get tier background gradient for badge (matching UIVerseGoalCard)
const getTierBackground = (difficulty: string, difficultyColor: string) => {
  switch (difficulty) {
    case "easy":
      return `linear-gradient(135deg, ${withAlpha(difficultyColor, 0.9)}, ${withAlpha(difficultyColor, 0.7)})`;
    case "medium":
      return `linear-gradient(135deg, ${withAlpha(difficultyColor, 0.95)}, ${withAlpha(difficultyColor, 0.75)})`;
    case "hard":
      return `linear-gradient(135deg, ${difficultyColor}, ${withAlpha(difficultyColor, 0.8)})`;
    case "extreme":
      return `linear-gradient(135deg, ${difficultyColor}, ${withAlpha(difficultyColor, 0.6)}, ${difficultyColor})`;
    case "impossible":
    case "custom":
      return `linear-gradient(135deg, ${difficultyColor}, ${withAlpha(difficultyColor, 0.7)}, ${difficultyColor})`;
    default:
      return difficultyColor;
  }
};

// Glossy overlay intensity based on difficulty
const getGlossIntensity = (difficulty: string): number => {
  switch (difficulty) {
    case "easy":
      return 0.08;
    case "medium":
      return 0.14;
    case "hard":
      return 0.22;
    case "extreme":
      return 0.28;
    case "impossible":
      return 0.32;
    case "custom":
      return 0.35;
    default:
      return 0.08;
  }
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

  const goalType = goal.goal_type || "standard";
  const isHabitGoal = goalType === "habit";
  const totalSteps = isHabitGoal ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
  const completedSteps = isHabitGoal ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const tags = getGoalTypeTags(goal.type);
  const intensity = getDifficultyIntensity(difficulty);
  const glossIntensity = getGlossIntensity(difficulty);

  // Create difficulty-based gradients
  const outlineGradient = `linear-gradient(135deg, ${adjustColorBrightness(difficultyColor, -40)}, ${difficultyColor}, ${adjustColorBrightness(difficultyColor, 20)})`;
  const avatarBorderGradient = `radial-gradient(circle at 10% 0%, ${adjustColorBrightness(difficultyColor, 30)}, ${difficultyColor}, ${adjustColorBrightness(difficultyColor, -40)})`;

  // Unique ID for scoped CSS keyframes
  const cardId = `bar-card-${goal.id.slice(0, 8)}`;

  return (
    <motion.div
      className={`${cardId} group`}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={() => onNavigate(goal.id)}
      style={{
        position: "relative",
        height: "140px",
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto",
        borderRadius: "25px",
        overflow: "hidden",
        background: "#f5f7ff",
        cursor: "pointer",
        transition: "height 0.5s ease",
      }}
    >
      {/* Main outline card */}
      <div
        className={`${cardId}-outline`}
        style={{
          position: "relative",
          background: outlineGradient,
          width: "100%",
          height: "140px",
          borderRadius: "25px",
          transition: "box-shadow 0.5s ease",
          zIndex: 2,
          overflow: "hidden",
        }}
      >
        {/* Split Line - Energy effect with difficulty colors */}
        <div
          className={`${cardId}-splitline`}
          style={{
            position: "absolute",
            width: "calc(100% - 80px)",
            height: "6px",
            bottom: "14px",
            left: "40px",
            borderRadius: "999px",
            background: `linear-gradient(90deg, transparent 0%, ${withAlpha(difficultyColor, 0.5)} 15%, ${difficultyColor} 40%, ${adjustColorBrightness(difficultyColor, -20)} 55%, ${difficultyColor} 70%, ${withAlpha(difficultyColor, 0.5)} 85%, transparent 100%)`,
            boxShadow: `0 0 10px ${withAlpha(difficultyColor, 0.6)}, 0 0 25px ${withAlpha(difficultyColor, 0.5)}`,
            filter: "blur(0.1px)",
            zIndex: 1,
            backgroundSize: "200% 100%",
            backgroundPosition: "0 0",
          }}
        />

        {/* Avatar / Image Frame */}
        <div
          style={{
            position: "absolute",
            top: "18px",
            left: "20px",
            width: "78px",
            height: "78px",
            borderRadius: "18px",
            padding: "3px",
            background: avatarBorderGradient,
            boxShadow: `0 0 16px ${withAlpha(difficultyColor, 0.65)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {goal.image_url ? (
            <img
              src={goal.image_url}
              alt={goal.name}
              className={isCompleted ? "grayscale opacity-70" : ""}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "16px",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "16px",
                background: `radial-gradient(circle at 30% 20%, ${difficultyColor}, #020b1b)`,
                opacity: 0.95,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trophy className="h-7 w-7 text-white/80" />
            </div>
          )}
        </div>

        {/* Focus Star Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFocus(goal.id, goal.is_focus || false, e);
          }}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full border transition-all hover:scale-110"
          style={{
            background: "rgba(0,0,0,0.5)",
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <Star className={`h-4 w-4 ${goal.is_focus ? "fill-yellow-400 text-yellow-400" : "text-white/70"}`} />
        </button>

        {/* Difficulty Badge - Same style as UIVerseGoalCard */}
        <Badge
          className="absolute z-10 text-[10px] uppercase tracking-wide font-semibold px-3 py-1 overflow-hidden"
          style={{
            top: "18px",
            left: "110px",
            borderRadius: "999px",
            color: "white",
            background: getTierBackground(difficulty, difficultyColor),
            border: `1px solid ${withAlpha(difficultyColor, 0.6)}`,
            backdropFilter: "blur(10px)",
            boxShadow: `0 0 ${8 + intensity * 3}px ${withAlpha(difficultyColor, 0.5)}, inset 0 1px 1px rgba(255,255,255,${glossIntensity})`,
          }}
        >
          {/* Glossy shine overlay */}
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,${glossIntensity * 1.2}) 0%, rgba(255,255,255,${glossIntensity * 0.3}) 40%, transparent 60%)`,
              borderRadius: "inherit",
            }}
          />
          <span className="relative z-10">{getDifficultyLabel(difficulty, customDifficultyName)}</span>
        </Badge>

        {/* Goal Name - Slightly smaller */}
        <h3
          className="font-orbitron"
          style={{
            position: "absolute",
            fontWeight: 700,
            color: "#ffffff",
            left: "110px",
            fontSize: "16px",
            top: "50px",
            margin: 0,
            maxWidth: "calc(100% - 160px)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {goal.name}
        </h3>

        {/* Status Badge */}
        <div
          className="font-rajdhani"
          style={{
            position: "absolute",
            left: "110px",
            top: "76px",
            margin: 0,
            fontSize: "12px",
            color: "#a4c9ff",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: isCompleted ? "#34c759" : goal.status === "in_progress" ? "#34c759" : "#f5a623",
              boxShadow: `0 0 6px ${isCompleted || goal.status === "in_progress" ? "rgba(52, 199, 89, 0.9)" : "rgba(245, 166, 35, 0.9)"}`,
            }}
          />
          {getStatusLabel(goal.status || "in_progress")}
        </div>

        {/* Steps Counter - Right side (replaces XP in collapsed view) */}
        <div
          className="font-rajdhani"
          style={{
            position: "absolute",
            right: "20px",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "4px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: "#8fb5ff",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {isHabitGoal ? "Days" : "Steps"}
          </span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: difficultyColor,
            }}
          >
            {completedSteps}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Expandable Detail Section - Lighter tones with difficulty tint */}
      <div
        className={`${cardId}-detail`}
        style={{
          position: "relative",
          display: "none",
          width: "100%",
          height: "110px",
          background: `radial-gradient(circle at top left, ${withAlpha(difficultyColor, 0.15)}, ${withAlpha(difficultyColor, 0.08)} 50%, rgba(15, 30, 60, 0.95))`,
          top: "-5px",
          zIndex: 1,
          borderRadius: "0 0 25px 25px",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: "20px",
          padding: "0 24px",
        }}
      >
        {/* XP Box - Now in expanded section only, on the left */}
        {goal.potential_score && goal.potential_score > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "14px",
              background: withAlpha(difficultyColor, 0.15),
              border: `1px solid ${withAlpha(difficultyColor, 0.4)}`,
              flexShrink: 0,
            }}
          >
            <Sparkles className="h-5 w-5" style={{ color: difficultyColor }} />
            <span
              className="font-rajdhani"
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 800,
                color: "#e6faff",
              }}
            >
              +{goal.potential_score} XP
            </span>
          </div>
        )}

        {/* Step Box */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span
              className="font-rajdhani"
              style={{
                letterSpacing: "0.3em",
                fontWeight: 800,
                fontSize: "11px",
                margin: 0,
                color: withAlpha(difficultyColor, 0.9),
              }}
            >
              {isHabitGoal ? "DAYS" : "STEP"}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="font-rajdhani"
                  style={{
                    fontSize: "10px",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: withAlpha(difficultyColor, 0.2),
                    color: "#c6e2ff",
                    border: `1px solid ${withAlpha(difficultyColor, 0.3)}`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              width: "100%",
              height: "8px",
              borderRadius: "999px",
              background: withAlpha(difficultyColor, 0.15),
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                height: "100%",
                background: `linear-gradient(90deg, ${adjustColorBrightness(difficultyColor, 30)}, ${difficultyColor}, ${adjustColorBrightness(difficultyColor, -20)})`,
                boxShadow: `0 0 8px ${withAlpha(difficultyColor, 0.6)}`,
              }}
            />
          </div>

          {/* Step Counter */}
          <span
            className="font-rajdhani"
            style={{
              marginTop: "6px",
              fontSize: "11px",
              color: "#8fb5ff",
              display: "block",
            }}
          >
            {completedSteps} / {totalSteps} {isHabitGoal ? "days" : "steps"} • {progress.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* CSS for hover effects with difficulty-colored animations */}
      <style>{`
        .${cardId}:hover {
          height: 250px !important;
        }
        .${cardId}:hover .${cardId}-outline {
          box-shadow: 0 10px 25px ${withAlpha(difficultyColor, 0.55)};
        }
        .${cardId}:hover .${cardId}-detail {
          display: flex !important;
          align-items: center;
          justify-content: flex-start;
          gap: 20px;
          padding: 0 24px;
          animation: ${cardId}-detail-slide-up 0.35s ease-out forwards;
        }
        .${cardId}:hover .${cardId}-splitline {
          animation: ${cardId}-energy-flow 1.1s linear infinite, ${cardId}-energy-flicker 0.18s infinite alternate;
          box-shadow: 0 0 14px ${withAlpha(difficultyColor, 0.9)}, 0 0 35px ${withAlpha(difficultyColor, 0.7)} !important;
        }
        @keyframes ${cardId}-detail-slide-up {
          0% { transform: translateY(15px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes ${cardId}-energy-flow {
          0% { background-position: 0% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes ${cardId}-energy-flicker {
          from { opacity: 0.85; filter: blur(0.2px); }
          to { opacity: 1; filter: blur(0.5px); }
        }
      `}</style>
    </motion.div>
  );
}
