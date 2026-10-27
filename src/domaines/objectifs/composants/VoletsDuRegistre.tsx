/* LES DEUX VOLETS D UNE LIGNE DU REGISTRE : ses membres, ses etapes.
 *
 * Cinquante lignes sorties de `GoalsRegistre.tsx`.
 */

import { useTranslation } from "react-i18next";
import { useGoalSteps } from "@/domaines/objectifs/hooks/useGoalSteps";

import type { Goal } from "@/domaines/objectifs/types";
import { teinte, libellePalier, avancement } from "@/domaines/objectifs/logique/ligneDuRegistre";

export function MembresDuGroupe({ membres, onNavigate, customDifficultyName, customDifficultyColor }: {
  membres: Goal[];
  onNavigate: (id: string) => void;
  customDifficultyName: string;
  customDifficultyColor: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="rg-membres">
      {membres.map((m) => {
        const av = avancement(m);
        return (
          <button key={m.id} type="button" className="rg-membre"
            style={{ ["--t" as string]: teinte(m, customDifficultyColor) }}
            onClick={(e) => { e.stopPropagation(); onNavigate(m.id); }}>
            <span className="rg-membre-p">{libellePalier(m, customDifficultyName, t)}</span>
            <span className="rg-membre-n">{m.name}</span>
            <span className="rg-membre-j" aria-hidden="true">
              {Array.from({ length: 10 }, (_, i) => (
                <u key={i} className={i < Math.round((av.pct / 100) * 10) ? "on" : ""} />
              ))}
            </span>
            <span className="rg-membre-c">{av.faits}/{av.total}</span>
          </button>
        );
      })}
    </div>
  );
}

export function EtapesDeLObjectif({ goalId }: { goalId: string }) {
  const { data: etapes = [], isLoading } = useGoalSteps(goalId);

  if (isLoading) return <p className="rg-attente">Chargement…</p>;
  if (etapes.length === 0) return <p className="rg-attente">Aucune étape.</p>;

  return (
    <ol className="rg-etapes-liste">
      {etapes.map((e, i) => {
        const faite = e.status === "completed" || e.status === "validated";
        return (
          <li key={e.id} className={faite ? "faite" : ""}>
            <span className="rg-etape-n">{String(i + 1).padStart(2, "0")}</span>
            <span className="rg-etape-coche" aria-hidden="true">{faite ? "✓" : ""}</span>
            <span className="rg-etape-t">{e.title || "Sans titre"}</span>
          </li>
        );
      })}
    </ol>
  );
}
