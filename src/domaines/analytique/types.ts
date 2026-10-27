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

/* ═══════════════════════════════════════════════════════════════
   TOUTE LA COUCHE DE TYPES DE L ANALYTIQUE, VENUE DU HOOK.

   `useAnalytics.ts` declarait dix-huit formes en plus de calculer.
   Les descendre une par une n a pas marche : chacune en appelait une
   autre — AnalyticsData tient PrevuReel qui tient TrendData qui tient
   GoalsByTag — et le typecheck redemandait la suivante a chaque fois.
   Elles descendent donc ENSEMBLE.

   C est le meme motif que les neuf premieres fois, a une nuance pres :
   ici ce n est pas UN type mal place, c est une couche entiere restee
   dans le fichier qui la produit.
   ═══════════════════════════════════════════════════════════════ */
export interface GoalsByDifficulty {
  difficulty: string;
  count: number;
  color: string;
}

export interface GoalsByTag {
  tag: string;
  count: number;
  color: string;
}

export interface TrendData {
  current: number;
  previous: number;
  percentChange: number;
}

/** Combien de fois une chose a été repoussée avant d'être faite. */
export interface Reports {
  reports: number;
  faites: number;
}

/** Où le temps de focus est réellement allé. */
export interface FocusParObjectif {
  id: string;
  nom: string;
  minutes: number;
  sessions: number;
}

/** L'heure à laquelle on est à l'ouvrage. */
export interface HeureDOuvrage {
  heure: number;
  taches: number;
  focus: number;
}

/** Un mois financier : ce qui était prévu, ce qui est tombé. */
export interface PrevuReel {
  month: string;
  reelDepenses: number;
  imprevuDepenses: number;
  reelRevenus: number;
  imprevuRevenus: number;
}

export interface AnalyticsData {
  goalsOverTime: { month: string; created: number; completed: number }[];
  healthTrend: { date: string; score: number }[];
  financeTrend: { month: string; income: number; expenses: number; savings: number }[];
  habitStreak: { date: string; completed: number; total: number }[];
  todoStats: { month: string; completed: number }[];
  goalsByDifficulty: GoalsByDifficulty[];
  goalsByTag: GoalsByTag[];
  pomodoroTrend: { date: string; minutes: number }[];
  goalVelocity: { month: string; avgDays: number }[];
  goalShowcase: {
    id: string;
    name: string;
    image_url: string | null;
    status: string;
    difficulty: string;
    potential_score: number;
    completion_date: string | null;
    progress: number;
  }[];
  topGoals: {
    id: string;
    name: string;
    image_url: string | null;
    difficulty: string;
    potential_score: number;
    completion_date: string | null;
  }[];
  summary: {
    totalGoals: number;
    completedGoals: number;
    totalSteps: number;
    completedSteps: number;
    avgHealthScore: number;
    totalSaved: number;
    currentStreak: number;
    pomodoroMinutes: number;
    totalCost: number;
    paidCost: number;
    remainingCost: number;
    activeGoals: number;
    totalXP: number;
    monthlyBurnRate: number;
  };
  trends: {
    goalsCompleted: TrendData;
    stepsCompleted: TrendData;
    healthScore: TrendData;
    focusMinutes: TrendData;
  };

  /* ── ce que la collecte élargie permet ── */
  reports: Reports[];
  focusParObjectif: FocusParObjectif[];
  tachesParCategorie: { categorie: string; n: number }[];
  tachesParDifficulte: { niveau: string; n: number }[];
  anneeQuiPreleve: { mois: number; montant: number; lignes: number }[];
  heureDOuvrage: HeureDOuvrage[];
  serieTaches: { date: string; n: number }[];
  /** Ce qui tombe à date, mois par mois, toutes sources confondues. */
  cequiTombe: { mois: string; evenements: number; echeances: number; jours: number }[];
  sommeil: { date: string; heures: number }[];
  energieTroisTemps: { date: string; matin: number | null; apresMidi: number | null; soir: number | null }[];
  prevuReel: PrevuReel[];
  /* Ce qui manque pour que les panneaux maigres deviennent lisibles.
     Un panneau qui dit ce qu'il attend vaut mieux qu'un panneau vide. */
  matiere: {
    relevesSante: number;
    relevesEnergie: number;
    nuitsMesurees: number;
    moisValides: number;
    sessionsLiees: number;
  };
}

/**
 * Avancement brut d'un objectif, en tenant compte de son type.
 *
 * Un objectif de type "habit" n'a aucune ligne dans la table steps : son
 * total_steps recopie ses habit_duration_days. Le lire comme des etapes fait
 * deux degats — il compte des jours de suivi parmi les etapes, alors qu'ils
 * sont deja comptes en habitudes, et il affiche l'habitude a 0 % quel que
 * soit le nombre de jours reellement tenus.
 */
export type AvancementLisible = Pick<
  LigneObjectif,
  "goal_type" | "habit_duration_days" | "habit_checks" | "total_steps" | "validated_steps"
>;
