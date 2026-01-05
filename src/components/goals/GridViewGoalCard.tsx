import { useState } from "react";
import { Star } from "lucide-react";

interface Goal {
  id: string;
  name: string;
  difficulty?: string | null;
  image_url?: string | null;
  is_focus?: boolean | null;
  goal_type?: string;
  habit_duration_days?: number | null;
  habit_checks?: boolean[] | null;
  totalStepsCount?: number;
  completedStepsCount?: number;
  status?: string | null;
}

interface GridViewGoalCardProps {
  goal: Goal;
  isCompleted?: boolean;
  customDifficultyName?: string;
  customDifficultyColor?: string;
  onNavigate: (goalId: string) => void;
  onToggleFocus: (goalId: string, currentFocus: boolean, e: React.MouseEvent) => void;
}

const getStatusLabel = (status: string) => {
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

export function GridViewGoalCard({
  goal,
  isCompleted = false,
  customDifficultyName = "",
  onNavigate,
  onToggleFocus,
}: GridViewGoalCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const difficulty = goal.difficulty || "easy";
  const goalType = goal.goal_type || "standard";

  const isHabitGoal = goalType === "habit";
  const totalSteps = isHabitGoal ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
  const completedSteps = isHabitGoal ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;

  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const getDifficultyLabel = (diff: string): string => {
    if (diff === "custom") return customDifficultyName || "Custom";
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  };

  const statusLabel = isCompleted ? "Completed" : getStatusLabel(goal.status || "not_started");

  return (
    <div
      className="card-container cursor-pointer"
      onClick={() => onNavigate(goal.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: "300px",
        height: "300px",
        position: "relative",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          borderRadius: "inherit",
          background: "linear-gradient(135deg, #0d1117, #141c27)",
          boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Bouton Focus */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFocus(goal.id, goal.is_focus || false, e);
          }}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full"
          style={{
            background: "rgba(0, 0, 0, 0.45)",
            border: "1px solid rgba(255, 255, 255, 0.35)",
            backdropFilter: "blur(4px)",
          }}
        >
          <Star className={`h-4 w-4 ${goal.is_focus ? "fill-yellow-400 text-yellow-400" : "text-white/70"}`} />
        </button>

        {/* FACE AVANT */}
        <div
          className="front-content"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontSize: "28px",
              fontWeight: 800,
              letterSpacing: "1px",
              background: "linear-gradient(135deg, #ff0f7b, #f89b29)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow: "0 4px 14px rgba(0, 0, 0, 0.3)",
              textAlign: "center",
            }}
          >
            {goal.name}
          </p>
        </div>

        {/* PANEL DÉPLIANT */}
        <div
          className="content"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "96%",
            height: "100%",
            background: "linear-gradient(-45deg, #ff0f7b, #f89b29)",
            color: "#fff",
            padding: "24px 22px",
            borderRadius: "inherit",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "inset 0 0 40px rgba(255, 255, 255, 0.1)",
            transform: isHovered ? "translateX(0)" : "translateX(96%)",
            transition: "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          {/* HEADER */}
          <div
            className="panel-header"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <h3
              className="heading"
              style={{
                fontSize: "26px",
                fontWeight: 900,
                margin: 0,
                textShadow: "0 6px 18px rgba(0, 0, 0, 0.35)",
                textAlign: "center",
              }}
            >
              {goal.name}
            </h3>
            <span
              className="difficulty-badge"
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                fontWeight: 700,
                fontSize: "13px",
                background: "rgba(255, 255, 255, 0.18)",
                border: "1px solid rgba(255, 255, 255, 0.45)",
                backdropFilter: "blur(6px)",
                boxShadow: "0 4px 18px rgba(0, 0, 0, 0.25)",
              }}
            >
              {getDifficultyLabel(difficulty)}
            </span>
          </div>

          {/* PROGRESSION */}
          <div
            className="panel-progress"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <div
              className="progress-bar"
              style={{
                width: "80%",
                height: "9px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.25)",
                overflow: "hidden",
              }}
            >
              <div
                className="progress-fill"
                style={{
                  height: "100%",
                  borderRadius: "inherit",
                  background: "linear-gradient(90deg, #ff0f7b, #f89b29)",
                  boxShadow: "0 0 12px rgba(255, 15, 123, 0.6)",
                  transition: "width 0.3s ease",
                  width: `${progress}%`,
                }}
              />
            </div>

            <div
              className="steps-text"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                opacity: 0.95,
                textAlign: "center",
              }}
            >
              <span>{completedSteps}</span>
              <span>
                {" "}
                / {totalSteps} {isHabitGoal ? "days" : "steps"}
              </span>
              {totalSteps > 0 && <span> • {Math.round(progress)}%</span>}
            </div>
          </div>

          {/* FOOTER / STATUT */}
          <div
            className="panel-footer"
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <p
              className="status"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.18)",
                border: "1px solid rgba(255, 255, 255, 0.35)",
                backdropFilter: "blur(6px)",
                margin: 0,
              }}
            >
              {statusLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
