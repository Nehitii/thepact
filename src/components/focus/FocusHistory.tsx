import { useState } from "react";
import { ChevronDown, Check, X, Clock, Target, ListTodo, History } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { PomodoroSession } from "@/hooks/usePomodoro";
import type { Goal } from "@/hooks/useGoals";
import type { TodoTask } from "@/hooks/useTodoList";

const cyberClip = "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";

interface FocusHistoryProps {
  sessions: PomodoroSession[];
  goals?: Goal[];
  todos?: TodoTask[];
}

export function FocusHistory({ sessions, goals = [], todos = [] }: FocusHistoryProps) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? sessions : sessions.slice(0, 10);

  if (sessions.length === 0) {
    return (
      <div className="w-full max-w-lg flex flex-col items-center justify-center py-8 text-center" style={{ clipPath: cyberClip }}>
        <History className="h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-mono text-muted-foreground">{t("focus.history.empty", "No sessions yet")}</p>
        <p className="text-[10px] font-mono text-muted-foreground/60 mt-1">{t("focus.history.emptyHint", "Start your first focus session!")}</p>
      </div>
    );
  }

  const getLinkedName = (s: PomodoroSession) => {
    if (s.linked_goal_id) {
      const goal = goals.find((g) => g.id === s.linked_goal_id);
      return goal ? { name: goal.name, type: "goal" as const } : null;
    }
    if (s.linked_todo_id) {
      const todo = todos.find((td) => td.id === s.linked_todo_id);
      return todo ? { name: todo.name, type: "todo" as const } : null;
    }
    return null;
  };

  return (
    <Collapsible className="w-full max-w-lg">
      <CollapsibleTrigger
        className="flex items-center justify-between w-full p-3 bg-card/40 backdrop-blur border border-border/50 hover:bg-card/60 transition-colors group focus-visible:ring-2 focus-visible:ring-primary"
        style={{ clipPath: cyberClip }}
      >
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          {t("focus.history.recentSessions")} ({sessions.length})
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2 space-y-1">
        {displayed.map((s) => {
          const linked = getLinkedName(s);
          return (
            <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-card/30 border border-border/30 text-xs" style={{ clipPath: cyberClip }}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {s.completed ? (
                  <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                ) : (
                  <X className="h-3 w-3 text-destructive shrink-0" />
                )}
                <span className="font-mono text-muted-foreground shrink-0">
                  {s.completed_at ? format(new Date(s.completed_at), "MMM d, HH:mm") : format(new Date(s.started_at), "MMM d, HH:mm")}
                </span>
                {linked && (
                  <span className="flex items-center gap-1 text-[10px] text-primary/70 truncate min-w-0">
                    {linked.type === "goal" ? <Target className="h-2.5 w-2.5 shrink-0" /> : <ListTodo className="h-2.5 w-2.5 shrink-0" />}
                    <span className="truncate">{linked.name}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground shrink-0 ml-2">
                <Clock className="h-3 w-3" />
                <span className="font-mono">{s.duration_minutes}m</span>
              </div>
            </div>
          );
        })}

        {sessions.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-center text-[10px] font-mono text-primary hover:text-primary/80 py-2 focus-visible:ring-2 focus-visible:ring-primary"
          >
            {showAll ? t("focus.history.showLess") : t("focus.history.showAll", { count: sessions.length })}
          </button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
