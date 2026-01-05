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
  onToggleFocus: (
    goalId: string,
    currentFocus: boolean,
    e: React.MouseEvent
  ) => void;
}

const getStatusLabel = (status?: string) => {
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
      return "Unknown";
  }
};

const getDifficultyLabel = (difficulty: string, custom?: string) => {
  if (difficulty === "custom") return custom || "Custom";
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

export function GridViewGoalCard({
  goal,
  isCompleted = false,
  customDifficultyName = "",
  onNavigate,
  onToggleFocus,
}: GridViewGoalCardProps) {
  const difficulty = goal.difficulty || "easy";

  const goalType = goal.goal_type || "standard";
  const isHabitGoal = goalType === "habit";

  const totalSteps = isHabitGoal
    ? goal.habit_duration_days || 0
    : goal.totalStepsCount || 0;

  const completedSteps = isHabitGoal
    ? goal.habit_checks?.filter(Boolean).length || 0
    : goal.completedStepsCount || 0;

  const progress =
    totalSteps > 0 ? Math.min(100, (completedSteps / totalSteps) * 100) : 0;

  return (
    <div
      className="card-container"
      onClick={() => onNavigate(goal.id)}
      style={{ cursor: "pointer" }}
    >
      <div className="card">
        {/* Focus star */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFocus(goal.id, goal.is_focus || false, e);
          }}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 30,
            padding: "6px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,.4)",
            background: "rgba(0,0,0,.35)",
          }}
        >
          <Star
            className={`h-4 w-4 ${
              goal.is_focus
                ? "fill-yellow-400 text-yellow-400"
                : "text-white"
            }`}
          />
        </button>

        {/* Front - Title */}
        <div className="front-content">
          <p>{goal.name}</p>
        </div>

        {/* Slide-out panel */}
        <div className="content">
          <div className="panel-header">
            <p className="heading">{goal.name}</p>

            <div className="difficulty-badge">
              {getDifficultyLabel(difficulty, customDifficultyName)}
            </div>
          </div>

          <div className="panel-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="steps-text">
              {completedSteps} / {totalSteps}{" "}
              {isHabitGoal ? "days" : "steps"}
            </div>
          </div>

          <div className="panel-footer">
            <p className="status">
              {getStatusLabel(goal.status)}
              {isCompleted && " • Completed"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

.card-container {
  width: 300px;
  height: 300px;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}

/* --- CARD --- */
.card {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: inherit;
  background: linear-gradient(135deg, #0d1117, #141c27);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
}

/* --- FRONT : TITLE --- */
.front-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.front-content p {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 1px;

  background: linear-gradient(135deg, #ff0f7b, #f89b29);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;

  text-align: center;
  padding: 0 20px;
}

/* --- SLIDE OUT PANEL --- */
.content {
  position: absolute;
  top: 0;
  right: 0;
  width: 96%;
  height: 100%;

  background: linear-gradient(-45deg, #ff0f7b, #f89b29);
  color: white;

  padding: 24px 22px;
  border-radius: inherit;

  transform: translateX(96%);
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  box-shadow: inset 0 0 40px rgba(255, 255, 255, 0.1);
}

.card:hover .content {
  transform: translateX(0);
}

/* --- HEADER --- */
.panel-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.heading {
  font-size: 20px;
  font-weight: 900;
  margin: 0;
}

/* --- BADGE --- */
.difficulty-badge {
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 13px;

  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(6px);
}

/* --- PROGRESS --- */
.panel-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.progress-bar {
  width: 80%;
  height: 9px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.25);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff0f7b, #f89b29);
  box-shadow: 0 0 12px rgba(255, 15, 123, 0.6);
}

.steps-text {
  font-size: 13px;
  font-weight: 600;
}

/* --- FOOTER --- */
.panel-footer {
  display: flex;
  justify-content: center;
}

.status {
  font-size: 14px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(6px);
  margin: 0;
}

