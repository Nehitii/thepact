import { Target, ListTodo, Settings, Music, BarChart3, History } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Goal } from "@/hooks/useGoals";
import type { TodoTask } from "@/hooks/useTodoList";

export type FocusPanel = "config" | "spotify" | "stats" | "history" | null;

interface FocusToolbarProps {
  goals: Goal[];
  todos: TodoTask[];
  linkedGoalId: string | null;
  linkedTodoId: string | null;
  onLinkGoal: (id: string | null) => void;
  onLinkTodo: (id: string | null) => void;
  activePanel: FocusPanel;
  onPanelChange: (panel: FocusPanel) => void;
}

export function FocusToolbar({
  goals,
  todos,
  linkedGoalId,
  linkedTodoId,
  onLinkGoal,
  onLinkTodo,
  activePanel,
  onPanelChange,
}: FocusToolbarProps) {
  const focusGoals = goals.filter((g) => g.status === "in_progress" || g.status === "not_started");

  const togglePanel = (panel: FocusPanel) => {
    onPanelChange(activePanel === panel ? null : panel);
  };

  return (
    <div className="w-full max-w-lg space-y-3">
      {/* Selects row */}
      <div className="flex gap-2">
        {/* Goal selector */}
        <div className="flex-1">
          <Select
            value={linkedGoalId || "none"}
            onValueChange={(v) => {
              onLinkGoal(v === "none" ? null : v);
              if (v !== "none") onLinkTodo(null);
            }}
          >
            <SelectTrigger className="bg-card/60 backdrop-blur border-border/50 text-xs h-8">
              <Target className="h-3 w-3 mr-1 text-primary shrink-0" />
              <SelectValue placeholder="Goal..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No goal</SelectItem>
              {focusGoals.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs">
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Todo selector */}
        <div className="flex-1">
          <Select
            value={linkedTodoId || "none"}
            onValueChange={(v) => {
              onLinkTodo(v === "none" ? null : v);
              if (v !== "none") onLinkGoal(null);
            }}
          >
            <SelectTrigger className="bg-card/60 backdrop-blur border-border/50 text-xs h-8">
              <ListTodo className="h-3 w-3 mr-1 text-accent shrink-0" />
              <SelectValue placeholder="Task..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No task</SelectItem>
              {todos.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Icon buttons row */}
      <div className="flex items-center justify-center gap-2">
        <ToolbarIconButton
          icon={Settings}
          label="Config"
          isActive={activePanel === "config"}
          onClick={() => togglePanel("config")}
        />
        <ToolbarIconButton
          icon={Music}
          label="Spotify"
          isActive={activePanel === "spotify"}
          onClick={() => togglePanel("spotify")}
        />
        <ToolbarIconButton
          icon={BarChart3}
          label="Stats"
          isActive={activePanel === "stats"}
          onClick={() => togglePanel("stats")}
        />
        <ToolbarIconButton
          icon={History}
          label="History"
          isActive={activePanel === "history"}
          onClick={() => togglePanel("history")}
        />
      </div>
    </div>
  );
}

function ToolbarIconButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] rounded-md border transition-all ${
        isActive
          ? "bg-primary/20 border-primary/40 text-primary"
          : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
