import { parseISO, differenceInDays } from "date-fns";
import { jourLocal } from "@/socle/outils/jour";
import type { LigneObjectif, LigneHabitude, LigneMois } from "@/domaines/analytique/types";

/* LES SIX COURBES DU TEMPS.
 *
 * Sante, finance, habitudes, taches, focus, vitesse. Toutes sorties du
 * `queryFn` de `useAnalytics` pour la meme raison que les lectures
 * elargies : posees a cote de l acces reseau, elles etaient exactes
 * par confiance.
 *
 * UNE HORLOGE EST UN PARAMETRE. `habitStreak` ecartait les jours a
 * venir en lisant `new Date()` dans sa boucle. Une fonction qui lit
 * l heure ne rend pas deux fois le meme resultat, donc ne s eprouve
 * pas : `maintenant` se passe, et vaut l heure courante par defaut.
 */
export interface Series {
  sante: { entry_date: string; sleep_quality?: number | null; mood_level?: number | null; activity_level?: number | null; hydration_glasses?: number | null; meal_balance?: number | null; stress_level?: number | null }[];
  /** Les mois de finance reellement valides. */
  finance: LigneMois[];
  /** Tous les objectifs du pacte : les habitudes se lisent sur leur
   *  histoire entiere, quelle que soit la periode affichee. */
  objectifs: LigneObjectif[];
  /** Ceux de la periode : la vitesse moyenne, elle, se mesure sur la
   *  fenetre choisie. La distinction etait invisible tant que les deux
   *  vivaient dans la meme portee — c est le compilateur qui l a dite. */
  objectifsDeLaPeriode: LigneObjectif[];
  habitudes: LigneHabitude[];
  taches: { completed_at?: string | null }[];
  sessions: { completed_at?: string | null; started_at?: string | null; duration_minutes?: number | null }[];
  maintenant?: Date;
}

export function courbesDuTemps({
  sante: health, finance, objectifs: allGoals, objectifsDeLaPeriode: goals, habitudes: habits,
  taches: todos, sessions: pomodoros, maintenant = new Date(),
}: Series) {
  // Health trend
  const healthTrend = health.map((h) => {
    const metrics = [h.sleep_quality, h.mood_level, h.activity_level, h.hydration_glasses ? Math.min(h.hydration_glasses / 8 * 5, 5) : null, h.meal_balance, h.stress_level ? 6 - h.stress_level : null].filter(Boolean) as number[];
    const avg = metrics.length ? metrics.reduce((a, b) => a + b, 0) / metrics.length : 0;
    return { date: h.entry_date, score: Math.round(avg * 20) };
  }).reverse();

  /* La courbe financiere lisait une table « finance » que plus rien
     n alimentait : deux lignes de fin 2025, aucune ecriture nulle
     part dans le projet. Elle affichait donc un trace fige pendant
     que les vrais chiffres vivaient dans les validations
     mensuelles. Elle lit desormais celles-ci — seulement les mois
     reellement valides, puisqu un mois non valide n a pas de
     montants constates. L epargne est ce qui reste. */
  const financeTrend = finance.map((f) => {
    const entrees = Number(f.actual_total_income || 0);
    const sorties = Number(f.actual_total_expenses || 0);
    return {
      month: f.month?.slice(0, 7),
      income: entrees,
      expenses: sorties,
      savings: Math.max(0, entrees - sorties),
    };
  });

  /* Habitudes, jour par jour.
   *
   * L'application suit deux mecanismes paralleles, et un seul vit :
   * les habitudes sont cochees dans goals.habit_checks, un tableau de
   * booleens ou l'index i vaut le i-eme jour depuis la creation de
   * l'objectif. La table habit_logs, elle, n'a jamais ete remplie —
   * son unique ecrivain, useToggleHabitLog, n'est branche a aucune
   * interface. Cet onglet lisait la table morte, d'ou son vide.
   *
   * On lit donc habit_checks, en repliant l'index sur une date, et on
   * retombe sur habit_logs si un jour ce mecanisme est rebranche. */
  const habitByDate = new Map<string, { completed: number; total: number }>();

  allGoals.forEach((g) => {
      const coches = g.habit_checks;
      if (g.goal_type !== "habit" || !Array.isArray(coches) || !g.created_at) return;
      const depart = new Date(g.created_at);
      coches.forEach((coche, i) => {
        const d = new Date(depart);
        d.setDate(d.getDate() + i);
        // Un jour a venir n'est ni tenu ni manque : il n'existe pas encore.
        if (d > maintenant) return;
        const cle = jourLocal(d);
        const e = habitByDate.get(cle) || { completed: 0, total: 0 };
        e.total++;
        if (coche) e.completed++;
        habitByDate.set(cle, e);
      });
    });

  habits.forEach((h) => {
    const entry = habitByDate.get(h.log_date) || { completed: 0, total: 0 };
    entry.total++;
    if (h.completed) entry.completed++;
    habitByDate.set(h.log_date, entry);
  });

  // Todo stats by month
  const todoByMonth = new Map<string, number>();
  todos.forEach((t) => {
    const m = t.completed_at?.slice(0, 7);
    if (m) todoByMonth.set(m, (todoByMonth.get(m) || 0) + 1);
  });

  // Pomodoro trend by day
  const pomodoroByDate = new Map<string, number>();
  pomodoros.forEach((p) => {
    const d = (p.completed_at || p.started_at)?.slice(0, 10);
    if (d) pomodoroByDate.set(d, (pomodoroByDate.get(d) || 0) + (p.duration_minutes || 0));
  });
  const pomodoroTrend = Array.from(pomodoroByDate.entries())
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Goal velocity (average days to complete)
  //
  // On mesure depuis start_date, pas created_at : c'est la date que
  // l'utilisateur declare comme depart de l'objectif, et c'est deja la
  // base utilisee ailleurs (VictoryReelCard). created_at ne sert que de
  // repli quand start_date est absent.
  //
  // Les durees negatives sont ecartees. Elles apparaissent quand un
  // objectif est saisi apres coup — la ligne est creee aujourd'hui avec
  // une completion_date anterieure. Ce n'est pas une mesure, c'est un
  // artefact de saisie, et il tirait la moyenne mensuelle jusqu'a
  // -135 jours sur le graphique.
  const goalVelocityByMonth = new Map<string, { totalDays: number; count: number }>();
  goals.forEach((g) => {
      const fin = g.completion_date;
      if (!fin) return;                       // pas encore franchi
      const depart = parseISO(g.start_date || g.created_at);
      const days = differenceInDays(parseISO(fin), depart);
      if (days < 0) return;
      const month = fin.slice(0, 7);
      const entry = goalVelocityByMonth.get(month) || { totalDays: 0, count: 0 };
      entry.totalDays += days;
      entry.count++;
      goalVelocityByMonth.set(month, entry);
    });
  const goalVelocity = Array.from(goalVelocityByMonth.entries())
    .map(([month, { totalDays, count }]) => ({ 
      month, 
      avgDays: Math.round(totalDays / count) 
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  return {
    healthTrend,
    financeTrend,
    goalVelocity,
    pomodoroTrend,
    /* Les deux Map sortent deja mises en forme : le hook n a pas a
       savoir qu un comptage par cle s est fait dans une Map. */
    habitStreak: Array.from(habitByDate.entries())
      .map(([date, d]) => ({ date, ...d }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    todoStats: Array.from(todoByMonth.entries())
      .map(([month, completed]) => ({ month, completed }))
      .sort((a, b) => a.month.localeCompare(b.month)),
  };
}
