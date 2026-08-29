import type { LigneObjectif, LigneEtape, LigneTag } from "@/domaines/analytique/types";

/* L ETAT DU PACTE, A UN INSTANT.
 *
 * Ce que les six courbes ne disent pas : non pas comment ca evolue,
 * mais ou on en est. Objectifs par mois, par difficulte, par etiquette,
 * etapes, cout total, cout paye, ce qui reste, et la cadence de
 * depense.
 *
 * DEUX COLLECTIONS, ENCORE. `objectifs` est filtre sur la periode —
 * c est de lui que sortent les repartitions. `tousLesObjectifs` ne l est
 * pas : un cout total qui changerait selon la fenetre affichee ne serait
 * pas un cout total.
 */


const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "hsl(142, 70%, 50%)",
  medium: "hsl(45, 95%, 55%)",
  hard: "hsl(25, 100%, 60%)",
  extreme: "hsl(0, 90%, 65%)",
  impossible: "hsl(280, 75%, 45%)",
  custom: "hsl(320, 70%, 55%)",
};

const TAG_COLORS: Record<string, string> = {
  arts: "hsl(320, 70%, 55%)",
  buying_selling: "hsl(30, 85%, 55%)",
  community: "hsl(190, 75%, 50%)",
  creative: "hsl(280, 75%, 55%)",
  diy: "hsl(175, 70%, 45%)",
  financial: "hsl(212, 90%, 55%)",
  health: "hsl(142, 70%, 50%)",
  learning: "hsl(25, 100%, 60%)",
  lifestyle: "hsl(350, 65%, 55%)",
  nature: "hsl(120, 60%, 45%)",
  personal: "hsl(200, 100%, 67%)",
  professional: "hsl(45, 95%, 55%)",
  relationship: "hsl(340, 75%, 55%)",
  spiritual: "hsl(260, 65%, 60%)",
  tech: "hsl(195, 85%, 50%)",
  travel: "hsl(165, 70%, 50%)",
  work: "hsl(15, 80%, 55%)",
  other: "hsl(210, 30%, 50%)",
};

export interface EtatDuPacte {
  objectifs: LigneObjectif[];
  tousLesObjectifs: LigneObjectif[];
  etapes: LigneEtape[];
  etiquettes: LigneTag[];
  /** Ce qui est deja mis de cote, hors objectifs franchis. */
  dejaFinance: number;
}

export function etatDuPacte({
  objectifs: goals, tousLesObjectifs: allGoals, etapes: steps,
  etiquettes: tags, dejaFinance: alreadyFunded,
}: EtatDuPacte) {
  const goalIds = goals.map((g) => g.id);
  // Goals over time (by month)
  const goalsByMonth = new Map<string, { created: number; completed: number }>();
  goals.forEach((g) => {
    const m = g.created_at?.slice(0, 7);
    if (m) {
      const entry = goalsByMonth.get(m) || { created: 0, completed: 0 };
      entry.created++;
      goalsByMonth.set(m, entry);
    }
    if (g.completion_date) {
      const cm = g.completion_date.slice(0, 7);
      const entry = goalsByMonth.get(cm) || { created: 0, completed: 0 };
      entry.completed++;
      goalsByMonth.set(cm, entry);
    }
  });

  // Goals by difficulty
  const difficultyCount = new Map<string, number>();
  goals.forEach((g) => {
    const d = g.difficulty || "easy";
    difficultyCount.set(d, (difficultyCount.get(d) || 0) + 1);
  });
  const goalsByDifficulty = Array.from(difficultyCount.entries()).map(([difficulty, count]) => ({
    difficulty,
    count,
    color: DIFFICULTY_COLORS[difficulty] || "hsl(210, 30%, 50%)",
  }));

  // Goals by tag (count unique goals per tag)
  const tagCount = new Map<string, number>();
  const filteredTags = tags.filter((t) => goalIds.includes(t.goal_id));
  filteredTags.forEach((t) => {
    tagCount.set(t.tag, (tagCount.get(t.tag) || 0) + 1);
  });
  const goalsByTag = Array.from(tagCount.entries()).map(([tag, count]) => ({
    tag,
    count,
    color: TAG_COLORS[tag] || "hsl(210, 30%, 50%)",
  }));

  // Steps statistics
  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.status === "completed").length;

  // Cost calculations (use all goals for total cost)
  const completedGoalIds = new Set(
    allGoals
      .filter((g) => ["completed", "fully_completed", "validated"].includes(g.status ?? ""))
      .map((g) => g.id)
  );

  const totalCost = allGoals.reduce((sum, g) => sum + (g.estimated_cost || 0), 0);

  // Paid = completed goals' costs + already_funded
  const completedGoalsCost = allGoals
    .filter((g) => completedGoalIds.has(g.id))
    .reduce((sum, g) => sum + (g.estimated_cost || 0), 0);

  const paidCost = Math.min(completedGoalsCost + alreadyFunded, totalCost);
  const remainingCost = Math.max(totalCost - paidCost, 0);

  // Active goals
  const activeGoals = allGoals.filter((g) => 
    g.status === "in_progress" || g.status === "not_started"
  ).length;

  // Monthly burn rate calculation
  const monthsWithExpenses = allGoals.filter((g) => g.completion_date).length;
  const monthlyBurnRate = monthsWithExpenses > 0 
    ? Math.round(completedGoalsCost / Math.max(monthsWithExpenses, 1))
    : 0;

  return {
    goalsOverTime: Array.from(goalsByMonth.entries())
      .map(([month, d]) => ({ month, ...d }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    goalsByDifficulty, goalsByTag,
    totalSteps, completedSteps,
    totalCost, paidCost, remainingCost, activeGoals, monthlyBurnRate,
  };
}
