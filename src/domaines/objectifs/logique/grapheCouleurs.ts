/* LES COULEURS ET LES MESURES DU GRAPHE D OBJECTIFS.
 *
 * Sorties de `pages/GoalsGraph.tsx` : une palette, des libelles et une
 * fonction d avancement ne sont pas de l interface. Elles sont ici pour
 * que la page ne declare plus ce qu elle se contente de lire.
 */

import type { ObjectifMesurable, EtatDuNoeud } from "@/domaines/objectifs/types";


/* Couleur = DIFFICULTE, pas statut.
 *
 * La version precedente colorait par statut, ce qui repondait a une
 * question que la liste traite deja mieux. Dans un arbre de competences
 * la couleur dit la NATURE du noeud — ici son palier — et son etat se lit
 * a autre chose : un noeud acquis brille, un noeud verrouille est eteint.
 * On code donc deux informations sans les faire se disputer le meme canal.
 *
 * La palette est celle des cartes de la vue grille, a l identique : le
 * meme objectif ne peut pas changer de couleur selon l ecran ou on le
 * regarde. */
export const PALIER: Record<string, string> = {
  easy: "#4ade80",
  medium: "#facc15",
  hard: "#fb923c",
  extreme: "#f87171",
  impossible: "#c084fc",
  custom: "#a855f7",
};

export const NOM_PALIER: Record<string, string> = {
  easy: "FACILE", medium: "MOYEN", hard: "DIFFICILE",
  extreme: "EXTREME", impossible: "IMPOSSIBLE", custom: "CUSTOM",
};

export const JAUNE = "#fcee0a";

export function avancement(g: ObjectifMesurable): number {
  const habit = g.goal_type === "habit";
  const total = habit ? g.habit_duration_days || 0 : g.totalStepsCount ?? g.total_steps ?? 0;
  const fait = habit
    ? (Array.isArray(g.habit_checks) ? g.habit_checks.filter(Boolean).length : 0)
    : g.completedStepsCount ?? g.validated_steps ?? 0;
  return total > 0 ? Math.min(100, Math.round((fait / total) * 100)) : 0;
}

export function etatDe(statut: string): EtatDuNoeud {
  if (statut === "fully_completed" || statut === "validated") return "acquis";
  if (statut === "in_progress") return "encours";
  return "verrouille";
}
