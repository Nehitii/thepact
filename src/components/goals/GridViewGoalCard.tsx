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
  customDifficultyColor?: string; // non utilisé dans ce design, mais conservé pour compat
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
    <div className="card-container cursor-pointer" onClick={() => onNavigate(goal.id)}>
      <div className="card">
        {/* Bouton Focus (étoile) en overlay */}
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

        {/* FACE AVANT (titre en dégradé) */}
        <div className="front-content">
          <p>{goal.name}</p>
        </div>

        {/* PANEL DÉPLIANT (contenu détaillé) */}
        <div className="content">
          {/* HEADER */}
          <div className="panel-header">
            <h3 className="heading">{goal.name}</h3>
            <span className="difficulty-badge">{getDifficultyLabel(difficulty)}</span>
          </div>

          {/* PROGRESSION */}
          <div className="panel-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="steps-text">
              <span>{completedSteps}</span>
              <span>
                {" "}
                / {totalSteps} {isHabitGoal ? "days" : "steps"}
              </span>
              {totalSteps > 0 && <span> • {Math.round(progress)}%</span>}
            </div>
          </div>

          {/* FOOTER / STATUT */}
          <div className="panel-footer">
            <p className="status">{statusLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
