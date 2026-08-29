import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

/* CONTRATS
 *
 * Nommage. Le premier jet s'appelait "Archive" — un mot qui designe ce
 * qui est clos et range. Or ces objectifs sont en cours : on les regarde
 * pour agir, pas pour se souvenir. "Contrat" dit l'engagement encore
 * ouvert, et rejoint le pacte dont ces objectifs sont les clauses.
 *
 * Hierarchie. Le premier jet assombrissait l'image a 32 % sous un voile
 * couvrant toute la fiche : l'image ne portait plus rien, elle faisait
 * texture. Elle est desormais le sujet — pleine intensite, et le voile
 * ne descend que sur le tiers bas, la ou le texte se pose. Une fiche
 * sans image recoit une trame technique plutot qu'un trou noir.
 */

interface GoalItem {
  id: string;
  name: string;
  image_url: string | null;
  status: string;
  difficulty: string;
  potential_score: number;
  completion_date: string | null;
  progress: number;
}

const TEINTES: Record<string, string> = {
  easy: "#00ff88",
  medium: "#00d4ff",
  hard: "#ff8c00",
  extreme: "#ff003c",
  impossible: "#cc00ff",
  custom: "#ff00aa",
};

const PALIERS: Record<string, string> = {
  easy: "FACILE",
  medium: "MOYEN",
  hard: "DIFFICILE",
  extreme: "EXTREME",
  impossible: "IMPOSSIBLE",
  custom: "CUSTOM",
};

const ETATS: Record<string, { txt: string; classe: string }> = {
  fully_completed: { txt: "HONORÉ", classe: "cp-etat-ok" },
  validated: { txt: "HONORÉ", classe: "cp-etat-ok" },
  in_progress: { txt: "EN COURS", classe: "cp-etat-actif" },
  not_started: { txt: "NON ENGAGÉ", classe: "cp-etat-attente" },
};

export function GoalContrats({ goals }: { goals: GoalItem[] }) {
  const navigate = useNavigate();

  // Les contrats en cours d'abord : ce sont ceux sur lesquels on peut
  // encore agir. Les contrats honores suivent.
  const items = useMemo(() => {
    const actifs = goals.filter((g) => g.status === "in_progress");
    const autres = goals.filter((g) => g.status !== "in_progress");
    return [...actifs, ...autres].slice(0, 12);
  }, [goals]);

  if (items.length === 0) {
    return <p className="ana-vide ds-t-label">Aucun contrat ouvert pour le moment.</p>;
  }

  return (
    <div className="cp-contrats">
      {items.map((g) => {
        const teinte = TEINTES[g.difficulty] || "#00d4ff";
        const etat = ETATS[g.status] || ETATS.not_started;
        const pct = Math.round(Math.min(100, Math.max(0, g.progress)));
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => navigate(`/goals?goal=${g.id}`)}
            className="cp-contrat cp-cadre"
            style={{ ["--t" as string]: teinte }}
            aria-label={`${g.name} — ${PALIERS[g.difficulty] || g.difficulty}, ${pct}% accompli`}
          >
            <span className="cp-fond cp-contrat-in">
              {g.image_url
                ? <img src={g.image_url} alt="" className="cp-contrat-img" loading="lazy" />
                : <span className="cp-contrat-trame" aria-hidden="true" />}

              <span className="cp-contrat-scrim" />
              <span className="cp-contrat-flanc" />

              <span className="cp-contrat-haut">
                <span className={`cp-fiche-etat ${etat.classe}`}>{etat.txt}</span>
                <span className="cp-contrat-xp">{g.potential_score} XP</span>
              </span>

              <span className="cp-contrat-bas">
                <span className="cp-contrat-palier">{PALIERS[g.difficulty] || g.difficulty}</span>
                <span className="cp-contrat-nom">{g.name}</span>
                <span className="cp-contrat-ligne">
                  <span className="cp-segments cp-contrat-barre">
                    <i style={{ width: `${pct}%` }} />
                  </span>
                  <span className="cp-contrat-pct">{pct}%</span>
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
