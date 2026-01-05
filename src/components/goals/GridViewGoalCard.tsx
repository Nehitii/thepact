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
  customDifficultyColor?: string; // pas utilisé ici mais on garde la signature
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

const getDifficultyLabel = (difficulty: string, customName?: string): string => {
  if (difficulty === "custom") return customName || "Custom";
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
  const totalSteps = isHabitGoal ? goal.habit_duration_days || 0 : goal.totalStepsCount || 0;
  const completedSteps = isHabitGoal ? goal.habit_checks?.filter(Boolean).length || 0 : goal.completedStepsCount || 0;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="card-container cursor-pointer" onClick={() => onNavigate(goal.id)}>
      <div className="card">
        {/* Bouton focus (étoile) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFocus(goal.id, goal.is_focus || false, e);
          }}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,
            padding: "6px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.4)",
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Star className={`h-4 w-4 ${goal.is_focus ? "fill-yellow-400 text-yellow-400" : "text-white"}`} />
        </button>

        {/* Face visible : Titre */}
        <div className="front-content">
          <p>{goal.name}</p>
        </div>

        {/* Panneau qui se déplie à droite au hover */}
        <div className="content">
          <div className="panel-header">
            <p className="heading">{goal.name}</p>
            <div className="difficulty-badge">{getDifficultyLabel(difficulty, customDifficultyName)}</div>
          </div>

          <div className="panel-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="steps-text">
              {completedSteps} / {totalSteps} {isHabitGoal ? "days" : "steps"}
            </div>
          </div>

          <div className="panel-footer">
            <p className="status">
              {getStatusLabel(goal.status || "not_started")}
              {isCompleted && " • Completed"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
