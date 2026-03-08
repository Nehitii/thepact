import { Target, ListTodo } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Goal } from "@/hooks/useGoals";
import type { TodoTask } from "@/hooks/useTodoList";

interface FocusGoalLinkerProps {
  goals: Goal[];
  todos: TodoTask[];
  linkedGoalId: string | null;
  linkedTodoId: string | null;
  onLinkGoal: (id: string | null) => void;
  onLinkTodo: (id: string | null) => void;
}

export function FocusGoalLinker({ goals, todos, linkedGoalId, linkedTodoId, onLinkGoal, onLinkTodo }: FocusGoalLinkerProps) {
  const focusGoals = goals.filter((g) => g.status === "in_progress" || g.status === "not_started");

  return (
    <div className="w-full max-w-sm space-y-3">
      <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground text-center">Link session to</p>

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
            <SelectTrigger className="bg-card/60 backdrop-blur border-border/50 text-xs h-9">
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
            <SelectTrigger className="bg-card/60 backdrop-blur border-border/50 text-xs h-9">
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
    </div>
  );
}
