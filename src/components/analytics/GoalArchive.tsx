import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

/* ARCHIVE DES OBJECTIFS
 *
 * Remplace GoalShowcase, qui etait une rangee de cartes arrondies au
 * style generique (rounded-xl, bg-card/40, backdrop-blur-sm) sans lien
 * avec le reste de la page.
 *
 * Chaque objectif devient une fiche d'archive : chanfrein a 45 degres,
 * image en fond assombrie, bande de difficulte coloree sur le flanc,
 * et progression en cellules discretes plutot qu'en trait lisse. La
 * difficulte n'est pas ecrite deux fois — sa couleur EST son etiquette,
 * reprise du flanc jusqu'a la barre.
 *
 * Placee dans TRAJECTOIRE : la courbe dit combien, l'archive dit
 * lesquels. C'est le visage concret de la meme mesure.
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
  fully_completed: { txt: "CLOS", classe: "cp-etat-ok" },
  validated: { txt: "CLOS", classe: "cp-etat-ok" },
  in_progress: { txt: "ACTIF", classe: "cp-etat-actif" },
  not_started: { txt: "EN ATTENTE", classe: "cp-etat-attente" },
};

export function GoalArchive({ goals }: { goals: GoalItem[] }) {
  const navigate = useNavigate();

  // Les objectifs en cours d'abord : ce sont ceux sur lesquels on peut
  // encore agir. Les objectifs clos suivent, du plus recent au plus ancien.
  const items = useMemo(() => {
    const actifs = goals.filter((g) => g.status === "in_progress");
    const clos = goals.filter((g) => g.status !== "in_progress");
    return [...actifs, ...clos].slice(0, 12);
  }, [goals]);

  if (items.length === 0) {
    return (
      <p className="ana-vide ds-t-label">Aucun objectif à archiver pour le moment.</p>
    );
  }

  return (
    <div className="cp-archive">
      {items.map((g) => {
        const teinte = TEINTES[g.difficulty] || "#00d4ff";
        const etat = ETATS[g.status] || ETATS.not_started;
        const pct = Math.round(Math.min(100, Math.max(0, g.progress)));
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => navigate(`/goals?goal=${g.id}`)}
            className="cp-fiche cp-cadre"
            style={{ ["--t" as string]: teinte }}
            aria-label={`${g.name} — ${PALIERS[g.difficulty] || g.difficulty}, ${pct}%`}
          >
            <span className="cp-fond cp-fiche-in">
              {g.image_url && (
                <img src={g.image_url} alt="" className="cp-fiche-img" loading="lazy" />
              )}
              <span className="cp-fiche-voile" />
              <span className="cp-fiche-flanc" />

              <span className="cp-fiche-haut">
                <span className={`cp-fiche-etat ${etat.classe}`}>{etat.txt}</span>
                <span className="cp-fiche-score">{g.potential_score} XP</span>
              </span>

              <span className="cp-fiche-bas">
                <span className="cp-fiche-palier">{PALIERS[g.difficulty] || g.difficulty}</span>
                <span className="cp-fiche-nom">{g.name}</span>
                <span className="cp-segments cp-fiche-barre">
                  <i style={{ width: `${pct}%` }} />
                </span>
                <span className="cp-fiche-pct">{pct}%</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
