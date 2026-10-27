import type { Goal } from "@/domaines/objectifs";
/* Trois etats, et rien entre : ils decident ce que la page montre a
   quelqu un qui arrive, a quelqu un qui avance, a quelqu un qui a
   deja franchi cinq objectifs. */
export type UserState = "onboarding" | "active" | "advanced";

/* CE QUE LE TABLEAU DE BORD MONTRE, CALCULE UNE FOIS.
 *
 * Cent lignes de `useMemo` au milieu de la page : des totaux, des
 * pourcentages, un cout engage, un age de pacte, six modules. Rien de
 * tout cela n a besoin de React — c est une fonction de ce que la base
 * a rendu vers ce que l ecran affiche.
 *
 * QUINZE LIGNES SONT PARTIES EN CHEMIN. Le cout engage, le cout paye
 * et le mode « objectif de financement » etaient calcules ici et lus
 * NULLE PART : le type du panneau qui recoit ce tableau ne les porte
 * meme pas. Ils forcaient en plus une dependance a useFinanceSettings,
 * donc un recalcul a chaque changement de
 * reglage financier, pour rien. Ils sont dans git si le panneau de
 * financement revient.
 *
 * TOUS CES NOMBRES SE TROMPENT EN SILENCE. Un total d etapes qui
 * compte les habitudes, un cout paye qui depasse l engage, un etat
 * « onboarding » qui ne s eteint jamais : rien ne casse, l ecran
 * affiche simplement autre chose que la verite.
 */
export interface EntreesDuTableau {
  objectifs: Goal[];
  pacte?: { created_at?: string | null } | null;
  /** Un module est-il possede ? Absent : rien n est possede. */
  moduleAchete?: (cle: string) => boolean;
  /** L heure qu il est. Passee pour que l age du pacte soit reproductible. */
  maintenant?: Date;
}

export function composerLeTableauDeBord({
  objectifs, pacte, moduleAchete, maintenant = new Date(),
}: EntreesDuTableau) {
  const habitGoals = objectifs.filter((g) => g.goal_type === "habit");
  const focusGoals = objectifs.filter((g) => g.goal_type !== "habit" && g.is_focus && g.status !== "fully_completed");

  /* Un objectif de type "habit" recopie ses habit_duration_days dans
     total_steps : 180 jours de suivi y deviennent 180 "etapes". Ces jours
     sont deja comptes plus bas en habitudes, donc les additionner aux
     etapes revient a les compter deux fois — et fausse tout ce qui se
     calcule en etapes. Un seul objectif du pacte est dans ce cas, mais il
     pesait a lui seul 180 des 364 etapes annoncees : le palier EXTREME
     s'affichait a 21 % d'avancement alors qu'il est a 85 %.
     Les habitudes restent comptees comme objectifs ; seules leurs
     pseudo-etapes sont exclues. */
  const goalsAvecEtapes = objectifs.filter((g) => g.goal_type !== "habit");

  const difficulties = ["easy", "medium", "hard", "extreme", "impossible", "custom"];
  const difficultyProgress = difficulties.map((difficulty) => {
    const diffGoals = objectifs.filter((g) => g.difficulty === difficulty);
    const diffGoalsAvecEtapes = diffGoals.filter((g) => g.goal_type !== "habit");
    const completedGoals = diffGoals.filter((g) => g.status === "fully_completed").length;
    const totalGoals = diffGoals.length;
    const totalStepsForDiff = diffGoalsAvecEtapes.reduce((sum, g) => sum + (g.total_steps || 0), 0);
    const completedStepsForDiff = diffGoalsAvecEtapes.reduce((sum, g) => sum + (g.validated_steps || 0), 0);
    return {
      difficulty,
      completed: completedGoals,
      total: totalGoals,
      percentage: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
      totalSteps: totalStepsForDiff,
      completedSteps: completedStepsForDiff,
      remainingSteps: totalStepsForDiff - completedStepsForDiff,
    };
  });

  const totalSteps = goalsAvecEtapes.reduce((sum, g) => sum + (g.total_steps || 0), 0);
  const totalStepsCompleted = goalsAvecEtapes.reduce((sum, g) => sum + (g.validated_steps || 0), 0);
  const totalHabitChecks = habitGoals.reduce((sum, g) => sum + (g.habit_duration_days || 0), 0);
  const completedHabitChecks = habitGoals.reduce((sum, g) => sum + (g.habit_checks?.filter(Boolean).length || 0), 0);
  const goalsCompleted = objectifs.filter((g) => g.status === "fully_completed").length;
  const totalGoalsCount = objectifs.length;

  const statusCounts = {
    not_started: objectifs.filter((g) => g.status === "not_started").length,
    in_progress: objectifs.filter((g) => g.status === "in_progress").length,
    fully_completed: objectifs.filter((g) => g.status === "fully_completed" || g.status === "validated").length,
  };

  const daysSincePactCreation = pacte?.created_at
    ? Math.floor((maintenant.getTime() - new Date(pacte.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  let userState: UserState = "active";
  if (totalGoalsCount <= 1 && daysSincePactCreation < 7) userState = "onboarding";
  else if (goalsCompleted >= 5) userState = "advanced";

  const moduleKeys = ["the-call", "finance", "todo-list", "journal", "track-health", "wishlist"];
  const ownedModules = {
    "the-call": moduleAchete?.("the-call") ?? false,
    finance: moduleAchete?.("finance") ?? false,
    "todo-list": moduleAchete?.("todo-list") ?? false,
    journal: moduleAchete?.("journal") ?? false,
    "track-health": moduleAchete?.("track-health") ?? false,
    wishlist: moduleAchete?.("wishlist") ?? false,
  };
  const lockedModules = moduleKeys.filter((key) => !ownedModules[key as keyof typeof ownedModules]);

  return {
    focusGoals,
    dashboardData: {
      difficultyProgress,
      totalStepsCompleted,
      totalSteps,
      totalHabitChecks,
      completedHabitChecks,
      goalsCompleted,
      totalGoals: totalGoalsCount,
      statusCounts,
    },
    userState,
    ownedModules,
    lockedModules,
  };
}
