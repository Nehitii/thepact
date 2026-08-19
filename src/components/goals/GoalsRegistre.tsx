import React, { memo, useMemo, useState } from "react";
import { ChevronRight, Crown, Lock, Star } from "lucide-react";
import { getStatusLabel } from "@/lib/goalConstants";
import { filterGoalsByRule, nomSansPrefixeGroupe, type SuperGoalRule } from "@/components/goals/super/types";
import type { Goal } from "@/hooks/useGoals";
import { useGoalSteps } from "@/hooks/useGoalSteps";

/* REGISTRE — la vue liste
 *
 * Les trois modes se partageaient deux usages. La barre montre les
 * objectifs un par un, la grille les montre en images, et la vue liste
 * refaisait la grille avec d'autres marges : meme hierarchie, memes
 * champs, aucun usage propre.
 *
 * Il restait une place vide : VOIR L'ENSEMBLE ET COMPARER. C'est ce que
 * le registre occupe. Une ligne par objectif, des colonnes alignees,
 * aucune image — trente-huit objectifs tiennent dans un ecran et se
 * lisent les uns contre les autres. Le palier, les etapes, l'avancement,
 * le poids en XP et l'etat se comparent colonne par colonne, ce qu'aucune
 * disposition en cartes ne permet.
 *
 * Le regroupement par constellation est une bascule, pas un mode a part.
 * Il repond a une autre question — « comment mon pacte est-il
 * structure ? » — sur les memes lignes, et rend lisible sans zoomer ce
 * que la page Constellation montre a 8px de texte.
 */

const PALIER: Record<string, string> = {
  easy: "#4ade80",
  medium: "#facc15",
  hard: "#fb923c",
  extreme: "#f87171",
  impossible: "#c084fc",
};

const NOM_PALIER: Record<string, string> = {
  easy: "FACILE",
  medium: "MOYEN",
  hard: "DIFFICILE",
  extreme: "EXTREME",
  impossible: "IMPOSSIBLE",
};

function teinte(g: Goal, couleurCustom: string): string {
  if (g.difficulty === "custom") return couleurCustom || "#a855f7";
  return PALIER[g.difficulty] || "#94a3b8";
}

function libellePalier(g: Goal, nomCustom: string): string {
  if (g.difficulty === "custom") return (nomCustom || "CUSTOM").toUpperCase();
  return NOM_PALIER[g.difficulty] || (g.difficulty || "").toUpperCase();
}

/** Avancement d'un objectif, quel que soit son type.
 *
 * Trois mecaniques coexistent et se lisent a des endroits differents :
 * un objectif ordinaire compte ses etapes, une habitude compte ses jours
 * coches, et un groupe compte ses objectifs membres. Les lire tous dans
 * total_steps donnerait 0/0 pour les deux derniers — c'est ce que le
 * registre affichait pour les groupes.
 */
function avancement(g: Goal, membres?: Goal[]): { faits: number; total: number; pct: number } {
  let total: number;
  let faits: number;

  if (g.goal_type === "super") {
    total = membres?.length ?? 0;
    faits = (membres || []).filter(
      (m) => m.status === "fully_completed" || m.status === "validated",
    ).length;
  } else if (g.goal_type === "habit") {
    total = g.habit_duration_days || 0;
    faits = Array.isArray(g.habit_checks) ? g.habit_checks.filter(Boolean).length : 0;
  } else {
    total = g.totalStepsCount ?? g.total_steps ?? 0;
    faits = g.completedStepsCount ?? g.validated_steps ?? 0;
  }

  return { faits, total, pct: total > 0 ? Math.min(100, Math.round((faits / total) * 100)) : 0 };
}

/** Membres d'un groupe : liste declaree, ou regle pour un groupe automatique. */
function membresDe(g: Goal, tous: Goal[]): Goal[] {
  const sg = g as any;
  const ordinaires = tous.filter((x) => x.goal_type !== "super");
  if (sg.is_dynamic_super && sg.super_goal_rule) {
    return filterGoalsByRule(
      ordinaires.filter((x) => x.id !== g.id),
      sg.super_goal_rule as SuperGoalRule,
    );
  }
  return ((sg.child_goal_ids || []) as string[])
    .map((id) => ordinaires.find((x) => x.id === id))
    .filter(Boolean) as Goal[];
}

type Etat = "attente" | "encours" | "honore";
function etatDe(g: Goal): Etat {
  if (g.status === "fully_completed" || g.status === "validated") return "honore";
  if (g.status === "in_progress") return "encours";
  return "attente";
}

interface Props {
  goals: Goal[];
  allGoals: Goal[];
  customDifficultyName?: string;
  customDifficultyColor?: string;
  onNavigate: (id: string) => void;
  onToggleFocus: (id: string, focus: boolean, e: React.MouseEvent) => void;
}

const CLE_GROUPE = "vowpact.registre.groupe";

export const GoalsRegistre = memo(function GoalsRegistre({
  goals,
  allGoals,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
  onNavigate,
  onToggleFocus,
}: Props) {
  const [grouper, setGrouper] = useState<boolean>(() => {
    try { return localStorage.getItem(CLE_GROUPE) === "1"; } catch { return false; }
  });

  /* Une seule ligne ouverte a la fois.
   *
   * Un accordeon a plusieurs volets ouverts redevient une longue liste :
   * on perd exactement ce que le registre apporte, la vue d ensemble. En
   * n en gardant qu un, la hauteur de la page reste stable et l oeil ne
   * quitte jamais la colonne qu il suivait.
   */
  const [ouvert, setOuvert] = useState<string | null>(null);
  const ouvrir = (id: string) => setOuvert((o) => (o === id ? null : id));

  const basculer = () => {
    setGrouper((v) => {
      const n = !v;
      try { localStorage.setItem(CLE_GROUPE, n ? "1" : "0"); } catch { /* stockage indisponible */ }
      return n;
    });
  };

  /* Rattachement d'un objectif a son groupe. Deux mecanismes coexistent :
     un groupe declare liste ses membres, un groupe dynamique les capte
     par une regle. On resout les deux, sans quoi la moitie des objectifs
     tomberait dans "sans groupe" alors qu'ils appartiennent bien
     quelque part. */
  const sections = useMemo(() => {
    if (!grouper) return null;

    const supers = allGoals.filter((g) => g.goal_type === "super");
    const ordinaires = allGoals.filter((g) => g.goal_type !== "super");
    const affiches = new Set(goals.map((g) => g.id));

    const parGroupe = supers.map((s) => {
      const sg = s as any;
      const membres: Goal[] = sg.is_dynamic_super && sg.super_goal_rule
        ? filterGoalsByRule(ordinaires.filter((x) => x.id !== s.id), sg.super_goal_rule as SuperGoalRule)
        : (((sg.child_goal_ids || []) as string[])
            .map((id) => ordinaires.find((x) => x.id === id))
            .filter(Boolean) as Goal[]);
      // On ne montre que ce qui est sur la page courante : le registre
      // reste pagine, le regroupement ne le contourne pas.
      return { groupe: s, membres: membres.filter((m) => affiches.has(m.id)) };
    }).filter((s) => s.membres.length > 0);

    const rattaches = new Set(parGroupe.flatMap((s) => s.membres.map((m) => m.id)));
    const libres = goals.filter((g) => g.goal_type !== "super" && !rattaches.has(g.id));

    return { parGroupe, libres };
  }, [grouper, goals, allGoals]);

  const ligne = (g: Goal, indente = false) => {
    const t = teinte(g, customDifficultyColor);
    const membres = g.goal_type === "super" ? membresDe(g, allGoals) : undefined;
    const av = avancement(g, membres);
    const etat = etatDe(g);
    const estOuvert = ouvert === g.id;
    // Un objectif sans etape et un groupe sans membre n'ont rien a deplier.
    const deployable = g.goal_type === "super" ? (membres?.length ?? 0) > 0 : av.total > 0;

    return (
      <div key={g.id} className={`rg-bloc${estOuvert ? " est-ouvert" : ""}`}>
        <div
          className={`rg-l${indente ? " rg-l--fils" : ""}`}
          style={{ ["--t" as string]: t }}
          role="button"
          tabIndex={0}
          onClick={() => onNavigate(g.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate(g.id); }
          }}
        >
          {indente && <span className="rg-branche" aria-hidden="true" />}

          {/* Le chevron deplie, la ligne ouvre l'objectif. Deux gestes
              distincts pour deux intentions distinctes : consulter le
              detail sur place, ou quitter la liste. */}
          {deployable ? (
            <button
              type="button"
              className="rg-chevron"
              aria-expanded={estOuvert}
              aria-label={estOuvert ? "Replier" : "Déplier"}
              onClick={(e) => { e.stopPropagation(); ouvrir(g.id); }}
            >
              <ChevronRight size={13} aria-hidden="true" />
            </button>
          ) : (
            <span className="rg-chevron rg-chevron--vide" aria-hidden="true" />
          )}

          <span className="rg-palier">{libellePalier(g, customDifficultyName)}</span>
          <span className="rg-nom">
            {g.goal_type === "super" && <Crown size={10} aria-hidden="true" />}
            {g.is_locked && <Lock size={10} aria-hidden="true" />}
            {g.goal_type === "super" ? nomSansPrefixeGroupe(g.name) : g.name}
          </span>
          <span className="rg-etapes">
            {av.faits}<i>/{av.total}</i>
          </span>
          <span className="rg-jauge" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <u key={i} className={i < Math.round((av.pct / 100) * 14) ? "on" : ""} />
            ))}
          </span>
          <span className="rg-xp">{g.potential_score ?? 0}</span>
          <span className={`rg-etat rg-etat--${etat}`}>{getStatusLabel(g.status || "not_started")}</span>
          <button
            type="button"
            className={`rg-focus${g.is_focus ? " active" : ""}`}
            onClick={(e) => { e.stopPropagation(); onToggleFocus(g.id, !!g.is_focus, e); }}
            aria-label={g.is_focus ? "Remove from focus" : "Set as focus"}
          >
            <Star size={12} fill={g.is_focus ? t : "none"} stroke={t} />
          </button>
        </div>

        {/* Le volet est toujours dans le DOM : c'est ce qui permet
            d'animer sa hauteur sans la mesurer en JavaScript. */}
        <div className="rg-volet" style={{ ["--t" as string]: t }}>
          <div className="rg-volet-in">
            {estOuvert && (
              g.goal_type === "super"
                ? <MembresDuGroupe membres={membres || []} onNavigate={onNavigate}
                    customDifficultyName={customDifficultyName}
                    customDifficultyColor={customDifficultyColor} />
                : <EtapesDeLObjectif goalId={g.id} />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rg">
      <div className="rg-barre">
        <span className="rg-titre ds-t-label">Registre</span>
        <span className="rg-fil" />
        <button
          type="button"
          role="switch"
          aria-checked={grouper}
          onClick={basculer}
          className="gl-bascule"
          data-actif={grouper}
          title="Ranger les objectifs sous le groupe auquel ils appartiennent, plutôt qu'à plat."
        >
          <span className="gl-bascule-piste" aria-hidden="true">
            <span className="gl-bascule-bloc" />
          </span>
          <span className="gl-bascule-txt ds-t-label">Par constellation</span>
        </button>
      </div>

      <div className="rg-tete" aria-hidden="true">
        <span>Palier</span>
        <span>Objectif</span>
        <span>Étapes</span>
        <span>Avancement</span>
        <span>XP</span>
        <span>État</span>
        <span />
      </div>

      {sections ? (
        <>
          {sections.parGroupe.map(({ groupe, membres }) => {
            const faits = membres.filter((m) => etatDe(m) === "honore").length;
            return (
              <div key={groupe.id} className="rg-section">
                <div
                  className="rg-groupe"
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate(groupe.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate(groupe.id); }
                  }}
                >
                  <Crown size={11} aria-hidden="true" />
                  <b>{nomSansPrefixeGroupe(groupe.name)}</b>
                  <span className="rg-fil" />
                  {membres.length <= 12 && (
                    <span className="rg-pastilles" aria-hidden="true">
                      {membres.map((m) => (
                        <u key={m.id} className={etatDe(m) === "honore" ? "on" : ""} />
                      ))}
                    </span>
                  )}
                  <span className="rg-compte">{faits}/{membres.length}</span>
                </div>
                {membres.map((m) => ligne(m, true))}
              </div>
            );
          })}

          {sections.libres.length > 0 && (
            <div className="rg-section">
              <div className="rg-groupe rg-groupe--libres">
                <b>Sans groupe</b>
                <span className="rg-fil" />
                <span className="rg-compte">{sections.libres.length}</span>
              </div>
              {sections.libres.map((g) => ligne(g, true))}
            </div>
          )}
        </>
      ) : (
        goals.map((g) => ligne(g))
      )}
    </div>
  );
});

/* Membres d un groupe, dans le volet. Volontairement plus sobres que les
   lignes principales : ce sont des enfants, pas des pairs. */
function MembresDuGroupe({ membres, onNavigate, customDifficultyName, customDifficultyColor }: {
  membres: Goal[];
  onNavigate: (id: string) => void;
  customDifficultyName: string;
  customDifficultyColor: string;
}) {
  return (
    <div className="rg-membres">
      {membres.map((m) => {
        const av = avancement(m);
        return (
          <button key={m.id} type="button" className="rg-membre"
            style={{ ["--t" as string]: teinte(m, customDifficultyColor) }}
            onClick={(e) => { e.stopPropagation(); onNavigate(m.id); }}>
            <span className="rg-membre-p">{libellePalier(m, customDifficultyName)}</span>
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

/* Etapes d un objectif. Elles ne sont demandees qu a l ouverture — voir
   useGoalSteps. */
function EtapesDeLObjectif({ goalId }: { goalId: string }) {
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

export default GoalsRegistre;
