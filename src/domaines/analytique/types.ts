/* LA PERIODE OBSERVEE.
 *
 * Ce type etait declare dans `composants/PeriodSelector.tsx`, et deux
 * hooks importaient donc un composant React pour connaitre une fenetre
 * de temps.
 *
 * NEUVIEME FOIS LE MOTIF, apres ExpressionMia, ObjetClause,
 * FinanceCategory, les neuf des taches, les quatre de l agenda,
 * ShopFilterState, les neuf du social et les deux des objectifs. Neuf
 * domaines sur seize l ont presente. Ce n est plus un accident, c est la
 * pente naturelle d un fichier : on declare le type ou on l utilise
 * d abord, et le premier usage est presque toujours un composant.
 */
export type AnalyticsPeriod = "30d" | "90d" | "6m" | "all";

/* LES LIGNES TELLES QU ELLES ARRIVENT DE LA BASE.
 *
 * Onze interfaces, une par `.select()`, sorties de `useAnalytics.ts`
 * qui faisait 888 lignes. Elles sont ici pour la meme raison que
 * `AnalyticsPeriod` : un type est inerte, il n a pas a vivre dans un
 * hook qui traine React Query et Supabase derriere lui.
 *
 * Leur interet est de RATER TOT : demander un champ qui n a pas ete lu
 * devient une erreur de compilation, au lieu d un `undefined` qui
 * traverse tout le calcul et ressort en zero. */
export interface LigneObjectif {
  id: string;
  name: string | null;
  created_at: string;
  start_date: string | null;
  status: string | null;
  completion_date: string | null;
  difficulty: string | null;
  estimated_cost: number | null;
  potential_score: number | null;
  total_steps: number | null;
  validated_steps: number | null;
  goal_type: string | null;
  habit_duration_days: number | null;
  habit_checks: boolean[] | null;
}
export interface LigneVitrine {
  id: string;
  name: string | null;
  image_url: string | null;
  status: string | null;
  difficulty: string | null;
  potential_score: number | null;
  completion_date: string | null;
  total_steps: number | null;
  validated_steps: number | null;
  goal_type: string | null;
  habit_duration_days: number | null;
  habit_checks: boolean[] | null;
}
export interface LigneEtape {
  id: string;
  goal_id: string;
  status: string | null;
  validated_at: string | null;
}
export interface LigneTag {
  goal_id: string;
  tag: string;
}
export interface LignePiece {
  goal_id: string;
  price: number | null;
  step_id: string | null;
}
export interface LigneHabitude {
  log_date: string;
  completed: boolean | null;
}
export interface LigneTodo {
  completed_at: string | null;
  task_name: string | null;
  priority: string | null;
  category: string | null;
  postpone_count: number | null;
  was_urgent: boolean | null;
}
export interface LigneSession {
  duration_minutes: number | null;
  completed_at: string | null;
  started_at: string | null;
  linked_goal_id: string | null;
}
export interface LigneSante {
  entry_date: string;
  sleep_hours: number | null;
  energy_morning: number | null;
  energy_afternoon: number | null;
  energy_evening: number | null;
}
export interface LigneDepense {
  amount: number | null;
  montant_total: number | null;
  periode_mois: number | null;
  mois_ancre: string | null;
  decalage_mois: number | null;
}
export interface LigneMois {
  month: string;
  actual_total_income: number | null;
  actual_total_expenses: number | null;
  unplanned_income: number | null;
  unplanned_expenses: number | null;
}
