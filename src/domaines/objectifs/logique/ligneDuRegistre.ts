/* CE QU ON CALCULE POUR UNE LIGNE DU REGISTRE : sa teinte, son palier,
 * son avancement.
 *
 * Trois fonctions pures sorties de `GoalsRegistre.tsx`. Elles y etaient
 * exportees a cote de composants, ce qui fait retomber Fast Refresh sur
 * un rechargement complet — meme correction que pour les canaux de raid
 * et le tri du dossier.
 */
import type { TFunction } from "i18next";
import type { Goal } from "@/domaines/objectifs/types";
import { estFranchi } from "@/domaines/objectifs/logique/superGoals";
import { getDifficultyLabel } from "@/domaines/objectifs/logique/goalConstants";
import { teinteDuPalier } from "@/domaines/objectifs/logique/teintes";

export function teinte(g: Goal, couleurCustom: string): string {
  return teinteDuPalier(g.difficulty, couleurCustom).couleur;
}

export function libellePalier(g: Goal, nomCustom: string, t: TFunction): string {
  return getDifficultyLabel(g.difficulty || "", t, nomCustom).toUpperCase();
}

/** Avancement d'un objectif, quel que soit son type.
 *
 * Trois mecaniques coexistent et se lisent a des endroits differents :
 * un objectif ordinaire compte ses etapes, une habitude compte ses jours
 * coches, et un groupe compte ses objectifs membres. Les lire tous dans
 * total_steps donnerait 0/0 pour les deux derniers — c'est ce que le
 * registre affichait pour les groupes.
 */
export function avancement(g: Goal, membres?: Goal[]): { faits: number; total: number; pct: number } {
  let total: number;
  let faits: number;

  if (g.goal_type === "super") {
    total = membres?.length ?? 0;
    faits = (membres || []).filter(estFranchi).length;
  } else if (g.goal_type === "habit") {
    total = g.habit_duration_days || 0;
    faits = Array.isArray(g.habit_checks) ? g.habit_checks.filter(Boolean).length : 0;
  } else {
    total = g.totalStepsCount ?? g.total_steps ?? 0;
    faits = g.completedStepsCount ?? g.validated_steps ?? 0;
  }

  return { faits, total, pct: total > 0 ? Math.min(100, Math.round((faits / total) * 100)) : 0 };
}
