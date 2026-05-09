import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Link2, X, GitBranch, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoals } from "@/hooks/useGoals";
import {
  useGoalDependencies,
  useCreateGoalDependency,
  useDeleteGoalDependency,
} from "@/hooks/useGoalDependencies";

interface Props {
  goalId: string;
}

export function GoalDependenciesPanel({ goalId }: Props) {
  const { data: goals = [] } = useGoals();
  const { data, isLoading } = useGoalDependencies(goalId);
  const create = useCreateGoalDependency();
  const remove = useDeleteGoalDependency();

  const [target, setTarget] = useState<string>("");
  const [kind, setKind] = useState<"blocks" | "related">("blocks");

  const linkedIds = useMemo(() => {
    const out = data?.outgoing.map(d => d.depends_on_goal_id) ?? [];
    return new Set([goalId, ...out]);
  }, [data, goalId]);

  const candidates = goals.filter(g => !linkedIds.has(g.id));

  const handleAdd = async () => {
    if (!target) return;
    await create.mutateAsync({ goal_id: goalId, depends_on_goal_id: target, kind });
    setTarget("");
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">Dépendances</h3>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground">Chargement…</div>
      ) : (
        <>
          {data?.outgoing.length ? (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Cet objectif dépend de</div>
              {data.outgoing.map(d => (
                <div key={d.id} className="flex items-center gap-2 rounded-md bg-background/60 border border-border/30 px-2 py-1.5 text-xs">
                  <ArrowRight className="h-3 w-3 text-primary/70" />
                  <Link to={`/goals/${d.depends_on_goal_id}`} className="flex-1 truncate hover:text-primary">
                    {d.depends_on_name ?? "?"}
                  </Link>
                  <span className="text-[9px] uppercase text-muted-foreground/70">{d.kind}</span>
                  {d.depends_on_status && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                      {d.depends_on_status}
                    </span>
                  )}
                  <button
                    onClick={() => remove.mutate(d.id)}
                    aria-label="Retirer"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {data?.incoming.length ? (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Bloque / lié à</div>
              {data.incoming.map(d => (
                <div key={d.id} className="flex items-center gap-2 rounded-md bg-background/40 border border-border/20 px-2 py-1.5 text-xs">
                  <Link2 className="h-3 w-3 text-muted-foreground" />
                  <Link to={`/goals/${d.goal_id}`} className="flex-1 truncate hover:text-primary">
                    {d.depends_on_name ?? "?"}
                  </Link>
                  <span className="text-[9px] uppercase text-muted-foreground/70">{d.kind}</span>
                </div>
              ))}
            </div>
          ) : null}

          {!data?.outgoing.length && !data?.incoming.length && (
            <div className="text-xs text-muted-foreground italic">Aucune dépendance pour le moment.</div>
          )}

          <div className="flex gap-2 pt-2 border-t border-border/30">
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="Choisir un objectif…" />
              </SelectTrigger>
              <SelectContent>
                {candidates.length === 0 ? (
                  <SelectItem value="none" disabled>Aucun objectif disponible</SelectItem>
                ) : (
                  candidates.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blocks">Bloque</SelectItem>
                <SelectItem value="related">Lié</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!target || target === "none" || create.isPending}
              className="h-8"
            >
              Ajouter
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
