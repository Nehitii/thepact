import type { SuperGoalChildInfo } from "@/domaines/objectifs/types";
import { computeSuperGoalProgress } from "@/domaines/objectifs/types";

/* UN OBJECTIF COMPTE SON AVANCEMENT DE TROIS FACONS SELON CE QU IL EST.
 *
 * Un groupe compte ses membres, une habitude ses jours coches, tout
 * autre objectif ses etapes faites. Trois numerateurs, trois
 * denominateurs, une seule barre a l ecran.
 *
 * LE CHOIX ETAIT ECRIT DEUX FOIS dans la fiche : une fois pour les
 * nombres, une fois pour l unite affichee a cote. Changer l un sans
 * l autre ne casse rien et n avertit de rien — la fiche annonce
 * simplement « 3/5 jours » pour un groupe. Ici le comptage et l unite
 * sortent de la meme decision.
 */
export type UniteDAvancement = "membres" | "jours" | "etapes";

export interface Avancement {
  faites: number;
  total: number;
  /** De 0 a 100. La barre s en sert telle quelle, le texte l arrondit. */
  pourcentage: number;
  unite: UniteDAvancement;
}

interface ObjectifCompte {
  goal_type?: string | null;
  habit_checks?: boolean[] | null;
  habit_duration_days?: number | null;
}

export function avancementDeLObjectif(
  goal: ObjectifCompte,
  steps: { status?: string | null }[],
  membres: SuperGoalChildInfo[],
): Avancement {
  if (goal.goal_type === "super") {
    /* Un groupe ne compte pas ses membres disparus : computeSuperGoalProgress
       les ecarte, et rend deja un pourcentage arrondi. */
    const p = computeSuperGoalProgress(membres);
    return { faites: p.completedCount, total: p.totalCount, pourcentage: p.percentage, unite: "membres" };
  }

  if (goal.goal_type === "habit") {
    const faites = goal.habit_checks?.filter(Boolean).length ?? 0;
    return { ...surCent(faites, goal.habit_duration_days ?? 0), unite: "jours" };
  }

  const faites = steps.filter((s) => s.status === "completed").length;
  return { ...surCent(faites, steps.length), unite: "etapes" };
}

/* UN OBJECTIF SANS ETAPE EST A ZERO, PAS A « NaN% ». Le denominateur
   tombe a un plutot qu a zero — c est ce que la fiche affichait deja,
   et le total montre alors « 0/1 ». */
function surCent(faites: number, total: number): { faites: number; total: number; pourcentage: number } {
  const denominateur = total || 1;
  return { faites, total: denominateur, pourcentage: (faites / denominateur) * 100 };
}
