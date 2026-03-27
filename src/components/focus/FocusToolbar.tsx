import { Target, ListTodo, Settings, Music, BarChart3, History } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const focusGoals = goals.filter((g) => g.status === "in_progress" || g.status === "not_started");

  const togglePanel = (panel: FocusPanel) => {
    onPanelChange(activePanel === panel ? null : panel);
  };

  return (
    <div className="w-full max-w-lg space-y-3">
      <div className="flex gap-2">
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
              <SelectValue placeholder={t("focus.linker.goal")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("focus.linker.noGoal")}</SelectItem>
              {focusGoals.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs">
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
              <SelectValue placeholder={t("focus.linker.task")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("focus.linker.noTask")}</SelectItem>
              {todos.map((td) => (
                <SelectItem key={td.id} value={td.id} className="text-xs">
                  {td.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <ToolbarIconButton icon={Settings} label={t("focus.toolbar.config")} isActive={activePanel === "config"} onClick={() => togglePanel("config")} />
        <ToolbarIconButton icon={Music} label={t("focus.toolbar.spotify")} isActive={activePanel === "spotify"} onClick={() => togglePanel("spotify")} />
        <ToolbarIconButton icon={BarChart3} label={t("focus.toolbar.stats")} isActive={activePanel === "stats"} onClick={() => togglePanel("stats")} />
        <ToolbarIconButton icon={History} label={t("focus.toolbar.history")} isActive={activePanel === "history"} onClick={() => togglePanel("history")} />
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
      className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] rounded-md border transition-all focus-visible:ring-2 focus-visible:ring-primary ${
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
