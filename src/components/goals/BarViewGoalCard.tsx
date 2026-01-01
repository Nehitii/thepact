import { motion } from "framer-motion";
import { Star, Sparkles, Trophy } from "lucide-react";
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
    case "not_started": return "Not Started";
    case "in_progress": return "In Progress";
    case "fully_completed": return "Completed";
    case "paused": return "Paused";
    case "validated": return "Validated";
    default: return status || "Unknown";
  }
};

const getGoalTypeTags = (type: string): string[] => {
  // Convert goal type to display tags
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

// Convert difficulty color to gradient components
const getDifficultyGradient = (difficultyColor: string) => {
  // Create gradient based on difficulty color
  return {
    outline: `linear-gradient(135deg, ${adjustColorBrightness(difficultyColor, -40)}, ${difficultyColor}, ${adjustColorBrightness(difficultyColor, 20)})`,
    splitLine: `linear-gradient(90deg, transparent 0%, ${adjustColorBrightness(difficultyColor, 30)}80 15%, ${difficultyColor} 40%, ${adjustColorBrightness(difficultyColor, -20)} 55%, ${difficultyColor} 70%, ${adjustColorBrightness(difficultyColor, 30)}80 85%, transparent 100%)`,
    avatarBorder: `radial-gradient(circle at 10% 0%, ${adjustColorBrightness(difficultyColor, 30)}, ${difficultyColor}, ${adjustColorBrightness(difficultyColor, -40)})`,
    badgeBorder: `${difficultyColor}e6`,
    badgeBg: `${adjustColorBrightness(difficultyColor, -50)}e6`,
  };
};

// Helper to adjust color brightness (works with hex)
const adjustColorBrightness = (color: string, amount: number): string => {
  // Handle HSL colors
  if (color.startsWith("hsl(")) {
    // Parse hsl and adjust lightness
    const match = color.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
    if (match) {
      const h = parseInt(match[1]);
      const s = parseInt(match[2]);
      const l = Math.max(0, Math.min(100, parseInt(match[3]) + amount));
      return `hsl(${h} ${s}% ${l}%)`;
    }
    return color;
  }
  
  // Handle hex colors
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const r = Math.max(0, Math.min(255, parseInt(full.slice(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(full.slice(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(full.slice(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
  
  return color;
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
  const difficultyColor = difficulty === "custom"
    ? customDifficultyColor
    : getUnifiedDifficultyColor(difficulty);

  const goalType = goal.goal_type || "standard";
  const isHabitGoal = goalType === "habit";
  const totalSteps = isHabitGoal ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
  const completedSteps = isHabitGoal ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const gradients = getDifficultyGradient(difficultyColor);
  const tags = getGoalTypeTags(goal.type);

  return (
    <motion.div
      className="bar-card-wrapper group"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={() => onNavigate(goal.id)}
      style={{
        position: "relative",
        height: "150px",
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto",
        borderRadius: "25px",
        overflow: "hidden",
        background: "#020714",
        cursor: "pointer",
        transition: "height 0.5s ease",
      }}
    >
      {/* Main outline card */}
      <div
        className="bar-card-outline"
        style={{
          position: "relative",
          background: gradients.outline,
          width: "100%",
          height: "150px",
          borderRadius: "25px",
          transition: "box-shadow 0.5s ease",
          zIndex: 2,
          overflow: "hidden",
        }}
      >
        {/* Split Line - Energy effect */}
        <div
          className="bar-card-splitline"
          style={{
            position: "absolute",
            width: "calc(100% - 80px)",
            height: "8px",
            bottom: "18px",
            left: "40px",
            borderRadius: "999px",
            background: gradients.splitLine,
            boxShadow: `0 0 10px ${difficultyColor}99, 0 0 25px ${difficultyColor}80`,
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
            top: "20px",
            left: "24px",
            width: "88px",
            height: "88px",
            borderRadius: "22px",
            padding: "3px",
            background: gradients.avatarBorder,
            boxShadow: `0 0 18px ${difficultyColor}a6`,
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
                borderRadius: "20px",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "20px",
                background: `radial-gradient(circle at 30% 20%, ${difficultyColor}, #020b1b)`,
                opacity: 0.95,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trophy className="h-8 w-8 text-white/80" />
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
          <Star
            className={`h-4 w-4 ${goal.is_focus ? "fill-yellow-400 text-yellow-400" : "text-white/70"}`}
          />
        </button>

        {/* Difficulty Badge */}
        <div
          style={{
            position: "absolute",
            top: "26px",
            left: "128px",
            padding: "4px 14px",
            borderRadius: "999px",
            fontWeight: 600,
            fontSize: "14px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#e6f7ff",
            background: gradients.badgeBg,
            border: `1px solid ${gradients.badgeBorder}`,
          }}
        >
          {getDifficultyLabel(difficulty, customDifficultyName)}
        </div>

        {/* Goal Name */}
        <h3
          className="font-orbitron"
          style={{
            position: "absolute",
            fontWeight: 700,
            color: "#ffffff",
            left: "128px",
            fontSize: "20px",
            top: "60px",
            margin: 0,
            maxWidth: "calc(100% - 200px)",
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
            left: "128px",
            top: "92px",
            margin: 0,
            fontSize: "13px",
            color: "#a4c9ff",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: isCompleted ? "#34c759" : goal.status === "in_progress" ? "#34c759" : "#f5a623",
              boxShadow: `0 0 8px ${isCompleted || goal.status === "in_progress" ? "rgba(52, 199, 89, 0.9)" : "rgba(245, 166, 35, 0.9)"}`,
            }}
          />
          {getStatusLabel(goal.status || "in_progress")}
        </div>

        {/* XP Box - Right side */}
        {goal.potential_score && goal.potential_score > 0 && (
          <div
            style={{
              position: "absolute",
              right: "24px",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 16px",
              borderRadius: "16px",
              background: "rgba(6, 28, 70, 0.7)",
              border: `1px solid ${difficultyColor}99`,
            }}
          >
            <Sparkles className="h-6 w-6 text-yellow-400" />
            <span
              className="font-rajdhani"
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 800,
                color: "#e6faff",
              }}
            >
              +{goal.potential_score} XP
            </span>
          </div>
        )}
      </div>

      {/* Expandable Detail Section */}
      <div
        className="bar-card-detail"
        style={{
          position: "relative",
          display: "none",
          width: "100%",
          height: "120px",
          background: "radial-gradient(circle at top left, #0b1f3a, #020714)",
          top: "-5px",
          zIndex: 1,
          borderRadius: "0 0 25px 25px",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: "24px",
          padding: "0 24px",
        }}
      >
        {/* Step Box */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <span
              className="font-rajdhani"
              style={{
                letterSpacing: "0.4em",
                fontWeight: 800,
                fontSize: "12px",
                margin: 0,
                color: "#8fb5ff",
              }}
            >
              {isHabitGoal ? "DAYS" : "STEP"}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="font-rajdhani"
                  style={{
                    fontSize: "11px",
                    padding: "3px 8px",
                    borderRadius: "999px",
                    background: "rgba(8, 40, 88, 0.9)",
                    color: "#c6e2ff",
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
              height: "10px",
              borderRadius: "999px",
              background: "rgba(8, 40, 88, 0.9)",
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
              }}
            />
          </div>

          {/* Step Counter */}
          <span
            className="font-rajdhani"
            style={{
              marginTop: "8px",
              fontSize: "12px",
              color: "#8fb5ff",
              display: "block",
            }}
          >
            {completedSteps} / {totalSteps} {isHabitGoal ? "days" : "steps"}
          </span>
        </div>
      </div>

      {/* CSS for hover effects */}
      <style>{`
        .bar-card-wrapper:hover {
          height: 270px !important;
        }
        .bar-card-wrapper:hover .bar-card-outline {
          box-shadow: 0 12px 25px ${difficultyColor}8c;
        }
        .bar-card-wrapper:hover .bar-card-detail {
          display: flex !important;
          align-items: center;
          justify-content: flex-start;
          gap: 24px;
          padding: 0 24px;
          animation: detail-slide-up 0.35s ease-out forwards;
        }
        .bar-card-wrapper:hover .bar-card-splitline {
          animation: energy-flow 1.1s linear infinite, energy-flicker 0.18s infinite alternate;
          box-shadow: 0 0 14px ${difficultyColor}e6, 0 0 35px ${difficultyColor}b3 !important;
        }
        @keyframes detail-slide-up {
          0% { transform: translateY(15px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes energy-flow {
          0% { background-position: 0% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes energy-flicker {
          from { opacity: 0.85; filter: blur(0.2px); }
          to { opacity: 1; filter: blur(0.5px); }
        }
      `}</style>
    </motion.div>
  );
}
