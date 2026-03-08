import { useState } from "react";
import { ChevronDown, Check, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { PomodoroSession } from "@/hooks/usePomodoro";

interface FocusHistoryProps {
  sessions: PomodoroSession[];
}

export function FocusHistory({ sessions }: FocusHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? sessions : sessions.slice(0, 10);

  if (sessions.length === 0) return null;

  return (
    <Collapsible className="w-full max-w-lg">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-xl bg-card/40 backdrop-blur border border-border/50 hover:bg-card/60 transition-colors group">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          Recent Sessions ({sessions.length})
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2 space-y-1">
        {displayed.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-card/30 border border-border/30 text-xs">
            <div className="flex items-center gap-2">
              {s.completed ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <X className="h-3 w-3 text-destructive" />
              )}
              <span className="font-mono text-muted-foreground">
                {s.completed_at ? format(new Date(s.completed_at), "MMM d, HH:mm") : format(new Date(s.started_at), "MMM d, HH:mm")}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="font-mono">{s.duration_minutes}m</span>
            </div>
          </div>
        ))}

        {sessions.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-center text-[10px] font-mono text-primary hover:text-primary/80 py-2"
          >
            {showAll ? "Show less" : `Show all ${sessions.length} sessions`}
          </button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
