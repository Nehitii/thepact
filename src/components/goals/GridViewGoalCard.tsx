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

/* --- STATUS LABELS --- */
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

/* --- THEME BY DIFFICULTY --- */
const getDifficultyTheme = (difficulty: string, customColor?: string) => {
  switch (difficulty) {
    case "easy":
      return {
        tint: "rgba(22,163,74,0.35)",
        glow: "0 0 25px rgba(22,163,74,0.55)",
        gradient: "linear-gradient(135deg, rgba(34,197,94,0.25), rgba(16,185,129,0.2))",
        progressFrom: "#4ade80",
        progressTo: "#16a34a",
      };

    case "medium":
      return {
        tint: "rgba(234,179,8,0.35)",
        glow: "0 0 25px rgba(234,179,8,0.55)",
        gradient: "linear-gradient(135deg, rgba(250,204,21,0.25), rgba(234,179,8,0.2))",
        progressFrom: "#fde047",
        progressTo: "#eab308",
      };

    case "hard":
      return {
        tint: "rgba(249,115,22,0.35)",
        glow: "0 0 25px rgba(249,115,22,0.55)",
        gradient: "linear-gradient(135deg, rgba(251,146,60,0.25), rgba(249,115,22,0.2))",
        progressFrom: "#fb923c",
        progressTo: "#f97316",
      };

    case "extreme":
      return {
        tint: "rgba(220,38,38,0.35)",
        glow: "0 0 25px rgba(220,38,38,0.6)",
        gradient: "linear-gradient(135deg, rgba(248,113,113,0.25), rgba(220,38,38,0.2))",
        progressFrom: "#fca5a5",
        progressTo: "#dc2626",
      };

    case "impossible":
      return {
        tint: "rgba(168,85,247,0.35)",
        glow: "0 0 25px rgba(168,85,247,0.6)",
        gradient: "linear-gradient(135deg, rgba(196,181,253,0.25), rgba(168,85,247,0.2))",
        progressFrom: "#d8b4fe",
        progressTo: "#a855f7",
      };

    case "custom": {
      const c = customColor || "#a855f7";
      return {
        tint: `${c}40`,
        glow: `0 0 25px ${c}80`,
        gradient: `linear-gradient(135deg, ${c}33, ${c}22)`,
        progressFrom: c,
        progressTo: c,
      };
    }

    default:
      return {
        tint: "rgba(107,114,128,0.35)",
        glow: "0 0 25px rgba(107,114,128,0.55)",
        gradient: "linear-gradient(135deg, rgba(156,163,175,0.25), rgba(75,85,99,0.2))",
        progressFrom: "#9ca3af",
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
  const theme = getDifficultyTheme(difficulty, customDifficultyColor);

  const goalType = goal.goal_type || "standard";
  const isHabit = goalType === "habit";

  const total = isHabit ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
  const done = isHabit ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;

  const progress = total > 0 ? (done / total) * 100 : 0;

  const label =
    difficulty === "custom"
      ? customDifficultyName || "Custom"
      : difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  return (
    <div
      onClick={() => onNavigate(goal.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: 300,
        height: 300,
        borderRadius: 18,
        overflow: "hidden",
        position: "relative",
        background: theme.gradient,
        boxShadow: theme.glow,
        border: "1px solid rgba(255,255,255,0.22)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* subtle glass overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(0,0,0,0.15))",
          pointerEvents: "none",
        }}
      />

      {/* Focus button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFocus(goal.id, goal.is_focus || false, e);
        }}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 3,
          padding: 8,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.35)",
        }}
      >
        <Star className={`h-4 w-4 ${goal.is_focus ? "fill-yellow-400 text-yellow-400" : "text-white/70"}`} />
      </button>

      {/* Front title */}
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 16px",
        }}
      >
        <p
          style={{
            fontSize: 26,
            fontWeight: 900,
            background: "linear-gradient(135deg, white, #ddd)",
            WebkitBackgroundClip: "text",
            color: "transparent",
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

      {/* Sliding panel */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: isHovered ? "translateX(0)" : "translateX(96%)",
          transition: "all .5s cubic-bezier(.23,1,.32,1)",
          borderRadius: 16,
          background: theme.gradient,
          color: "white",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "inset 0 0 40px rgba(255,255,255,.15)",
        }}
      >
        {/* Header */}
        <h3
          style={{
            fontSize: 24,
            fontWeight: 900,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "center",
          }}
          title={goal.name}
        >
          {goal.name}
        </h3>

        {/* Difficulty chip */}
        <span
          style={{
            alignSelf: "center",
            padding: "6px 14px",
            borderRadius: 999,
            background: "rgba(0,0,0,.25)",
            border: "1px solid rgba(255,255,255,.35)",
            backdropFilter: "blur(6px)",
            fontWeight: 700,
          }}
        >
          {label}
        </span>

        {/* Progress */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "80%",
              height: 10,
              borderRadius: 999,
              margin: "0 auto",
              background: "rgba(255,255,255,.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: "inherit",
                background: `linear-gradient(90deg, ${theme.progressFrom}, ${theme.progressTo})`,
              }}
            />
          </div>

          <p style={{ marginTop: 6, fontWeight: 600 }}>
            {done} / {total} {isHabit ? "days" : "steps"}
            {total > 0 && ` • ${Math.round(progress)}%`}
          </p>
        </div>

        {/* Status */}
        <p
          style={{
            alignSelf: "center",
            padding: "6px 14px",
            borderRadius: 10,
            background: "rgba(0,0,0,.25)",
            border: "1px solid rgba(255,255,255,.35)",
            backdropFilter: "blur(6px)",
            fontWeight: 600,
          }}
        >
          {isCompleted ? "Completed" : getStatusLabel(goal.status || "not_started")}
        </p>
      </div>
    </div>
  );
}
