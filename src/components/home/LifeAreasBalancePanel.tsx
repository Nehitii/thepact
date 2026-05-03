import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import { useLifeAreas } from "@/hooks/useLifeAreas";
import { useGoals } from "@/hooks/useGoals";
import { useActivePact } from "@/hooks/useActivePact";
import { DSPanel, DSEmptyState } from "@/components/ds";

/**
 * Home — Equilibre des domaines.
 * Affiche un radar léger / liste-bar de la répartition des goals actifs
 * par life area, avec poids cible vs réel.
 */
export function LifeAreasBalancePanel() {
  const { areas, isLoading } = useLifeAreas();
  const { pact } = useActivePact();
  const { data: goals = [] } = useGoals(pact?.id);
  const navigate = useNavigate();

  const distribution = useMemo(() => {
    const counts = new Map<string, number>();
    let total = 0;
    (goals ?? []).forEach((g: any) => {
      if (!g?.life_area_id) return;
      counts.set(g.life_area_id, (counts.get(g.life_area_id) ?? 0) + 1);
      total += 1;
    });
    return { counts, total };
  }, [goals]);

  if (isLoading) return null;

  if (areas.length === 0) {
    return (
      <DSPanel tier="secondary" title="Équilibre des domaines">
        <DSEmptyState
          visual="scope"
          accent="primary"
          message="DOMAINES NON DÉFINIS"
          description="Pivot d'alignement pour goals, habits et finance."
          ctaLabel="Configurer"
          onClick={() => navigate("/profile/life-areas")}
        />
      </DSPanel>
    );
  }

  return (
    <DSPanel
      tier="secondary"
      title="Équilibre des domaines"
      headerAction={
        <button
          onClick={() => navigate("/profile/life-areas")}
          className="text-[10px] font-orbitron uppercase tracking-wider text-primary/60 hover:text-primary transition-colors"
        >
          Gérer
        </button>
      }
    >
      <ul className="space-y-2.5">
        {areas.map((a) => {
          const count = distribution.counts.get(a.id) ?? 0;
          const actual = distribution.total > 0 ? Math.round((count / distribution.total) * 100) : 0;
          const delta = actual - a.weight;
          return (
            <li key={a.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs font-rajdhani">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: a.color, boxShadow: `0 0 6px ${a.color}` }}
                  />
                  <span className="truncate">{a.name}</span>
                  <span className="text-muted-foreground tabular-nums">· {count} goal{count !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-2 font-orbitron text-[10px] tabular-nums">
                  <span className="text-primary/80">{actual}%</span>
                  <span className="text-muted-foreground/60">/ {a.weight}%</span>
                  {delta !== 0 && (
                    <span className={delta > 0 ? "text-primary/60" : "text-amber-400/70"}>
                      {delta > 0 ? "+" : ""}{delta}
                    </span>
                  )}
                </div>
              </div>
              <div className="relative h-1.5 rounded-full bg-card overflow-hidden">
                {/* target marker */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-primary/40"
                  style={{ left: `${a.weight}%` }}
                />
                {/* actual fill */}
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(actual, 100)}%`,
                    background: a.color,
                    boxShadow: `0 0 8px ${a.color}66`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </DSPanel>
  );
}