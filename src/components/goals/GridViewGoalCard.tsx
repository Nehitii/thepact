import React, { useState } from "react";
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

// Thème couleur par difficulté (badge, gradient panel, barre de progression)
const getDifficultyTheme = (difficulty: string, customColor?: string) => {
  switch (difficulty) {
    case "easy":
      return {
        color: "#16a34a",
        glow: "rgba(22,163,74,0.65)",
        background: "rgba(22,163,74,0.18)",
        border: "rgba(22,163,74,0.45)",
        gradientFrom: "#22c55e",
        gradientTo: "#16a34a",
        progressFrom: "#4ade80",
        progressTo: "#16a34a",
      };

    case "medium":
      return {
        color: "#eab308",
        glow: "rgba(234,179,8,0.65)",
        background: "rgba(234,179,8,0.18)",
        border: "rgba(234,179,8,0.45)",
        gradientFrom: "#facc15",
        gradientTo: "#eab308",
        progressFrom: "#fde047",
        progressTo: "#eab308",
      };

    case "hard":
      return {
        color: "#f97316",
        glow: "rgba(249,115,22,0.65)",
        background: "rgba(249,115,22,0.18)",
        border: "rgba(249,115,22,0.45)",
        gradientFrom: "#fb923c",
        gradientTo: "#f97316",
        progressFrom: "#fed7aa",
        progressTo: "#f97316",
      };

    case "extreme":
      return {
        color: "#dc2626",
        glow: "rgba(220,38,38,0.7)",
        background: "rgba(220,38,38,0.18)",
        border: "rgba(220,38,38,0.45)",
        gradientFrom: "#f97373",
        gradientTo: "#dc2626",
        progressFrom: "#fecaca",
        progressTo: "#dc2626",
      };

    case "impossible":
      return {
        color: "#a855f7",
        glow: "rgba(168,85,247,0.7)",
        background: "rgba(168,85,247,0.20)",
        border: "rgba(168,85,247,0.45)",
        gradientFrom: "#c4b5fd",
        gradientTo: "#a855f7",
        progressFrom: "#e9d5ff",
        progressTo: "#a855f7",
      };

    case "custom": {
      const base = customColor || "#a855f7";
      return {
        color: base,
        glow: `${base}B3`, // ~70% opacity
        background: `${base}30`,
        border: `${base}70`,
        gradientFrom: base,
        gradientTo: base,
        progressFrom: base,
        progressTo: base,
      };
    }

    default:
      return {
        color: "#6b7280",
        glow: "rgba(107,114,128,0.6)",
        background: "rgba(107,114,128,0.18)",
        border: "rgba(107,114,128,0.45)",
        gradientFrom: "#9ca3af",
        gradientTo: "#4b5563",
        progressFrom: "#d1d5db",
        progressTo: "#6b7280",
      };
  }
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

  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const getDifficultyLabel = (diff: string): string => {
    if (diff === "custom") return customDifficultyName || "Custom";
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  };

  const statusLabel = isCompleted ? "Completed" : getStatusLabel(goal.status || "not_started");

  const theme = getDifficultyTheme(difficulty, customDifficultyColor);

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
          background: "linear-gradient(135deg, #05070d, #0d1117)",
          boxShadow: `0 12px 28px rgba(0, 0, 0, 0.45), 0 0 22px ${theme.glow}`,
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
            background: "rgba(0, 0, 0, 0.55)",
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
            padding: "0 18px",
          }}
        >
          <p
            style={{
              fontSize: "22px", // 🔹 réduit
              fontWeight: 800,
              letterSpacing: "0.8px",
              background: "linear-gradient(135deg, #ffedd5, #fed7aa)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow: "0 0 8px rgba(248,148,69,0.65), 0 0 18px rgba(255,111,145,0.8), 0 0 32px rgba(0,0,0,0.6)",
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
            title={goal.name}
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
            background: `linear-gradient(-45deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
            color: "#fff",
            padding: "24px 22px",
            borderRadius: "inherit",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: `inset 0 0 40px rgba(255, 255, 255, 0.15), 0 0 26px ${theme.glow}`,
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
                fontSize: "20px", // 🔹 réduit
                fontWeight: 800,
                margin: 0,
                textShadow: "0 0 10px rgba(0,0,0,0.7), 0 0 18px rgba(0,0,0,0.9), 0 0 32px rgba(0,0,0,0.9)",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
              title={goal.name}
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
                color: "white",
                background: theme.background,
                border: `1px solid ${theme.border}`,
                backdropFilter: "blur(6px)",
                boxShadow: `0 4px 18px ${theme.glow}, 0 0 18px ${theme.glow}`,
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
                  background: `linear-gradient(90deg, ${theme.progressFrom}, ${theme.progressTo})`,
                  boxShadow: `0 0 14px ${theme.glow}`,
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
                boxShadow: `0 0 14px rgba(0,0,0,0.5)`,
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
