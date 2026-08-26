import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, subMonths, format, parseISO, differenceInDays } from "date-fns";
import type { AnalyticsPeriod } from "@/components/analytics/PeriodSelector";

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

/**
 * ═══════════════════════════════════════════════════════════════
 * CE QUE LA PAGE NE SAVAIT PAS ENCORE LIRE.
 *
 * La collecte prenait sept champs de santé sur les treize mesurables, et
 * UN SEUL de l'historique des tâches — la date d'accomplissement — alors
 * que la table en porte onze. Les sessions de focus étaient lues sans
 * leur rattachement, donc sans jamais pouvoir dire À QUOI le temps est
 * passé. Rien ne pouvait être analysé qui n'était pas d'abord ramené.
 * ═══════════════════════════════════════════════════════════════
 */

/* Les lignes telles qu'elles arrivent. Le reste du fichier travaille
   encore en `any` — ce n'est pas une raison d'en ajouter. */
interface LigneTodo {
  completed_at: string | null;
  task_name: string | null;
  priority: string | null;
  category: string | null;
  postpone_count: number | null;
  was_urgent: boolean | null;
}
interface LigneSession {
  duration_minutes: number | null;
  completed_at: string | null;
  started_at: string | null;
  linked_goal_id: string | null;
}
interface LigneSante {
  entry_date: string;
  sleep_hours: number | null;
  energy_morning: number | null;
  energy_afternoon: number | null;
  energy_evening: number | null;
}
interface LigneDepense {
  amount: number | null;
  montant_total: number | null;
  periode_mois: number | null;
  mois_ancre: string | null;
  decalage_mois: number | null;
}
interface LigneMois {
  month: string;
  actual_total_income: number | null;
  actual_total_expenses: number | null;
  unplanned_income: number | null;
  unplanned_expenses: number | null;
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

function getPeriodDates(period: AnalyticsPeriod): { start: Date; mid: Date } {
  const now = new Date();
  switch (period) {
    case "30d":
      return { start: subDays(now, 30), mid: subDays(now, 60) };
    case "90d":
      return { start: subDays(now, 90), mid: subDays(now, 180) };
    case "6m":
      return { start: subMonths(now, 6), mid: subMonths(now, 12) };
    case "all":
    default:
      return { start: new Date(2020, 0, 1), mid: new Date(2020, 0, 1) };
  }
}

function computeTrend(current: number, previous: number): TrendData {
  const percentChange = previous === 0 
    ? (current > 0 ? 100 : 0)
    : Math.round(((current - previous) / previous) * 100);
  return { current, previous, percentChange };
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
function avancementBrut(g: any): { total: number; completed: number } {
  if (g?.goal_type === "habit") {
    return {
      total: g.habit_duration_days || 0,
      completed: Array.isArray(g.habit_checks) ? g.habit_checks.filter(Boolean).length : 0,
    };
  }
  return { total: g?.total_steps || 0, completed: g?.validated_steps || 0 };
}

export function useAnalytics(period: AnalyticsPeriod = "all") {
  const { user } = useAuth();

  return useQuery({
    /* LA CLE PORTE LA FORME, PAS SEULEMENT LES FILTRES.
       La forme du resultat a change — dix lectures de plus. Un cache
       ecrit avant ce changement rend un objet sans ces champs, et la
       page casse sur le premier .reduce(). Constate en developpement,
       et ca vaudrait pour un onglet reste ouvert pendant un deploiement.
       La cle change donc quand la forme change. */
    queryKey: ["analytics-dashboard", "v2", user?.id, period],
    // Le changement de periode conserve les donnees precedentes pendant le
    // chargement. Sans cela `data` repasse a undefined, la page entiere
    // bascule en squelettes, et le selecteur de periode lui-meme est
    // demonte puis remonte : c'est ce qui le faisait scintiller.
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<AnalyticsData> => {
      if (!user?.id) throw new Error("Not authenticated");

      const { start, mid } = getPeriodDates(period);
      const startStr = format(start, "yyyy-MM-dd");
      const midStr = format(mid, "yyyy-MM-dd");

      // First get user's pact to filter goals
      const { data: pactData } = await supabase
        .from("pacts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const pactId = pactData?.id;

      // Parallel fetch all data - filter goals by pact_id
      const [goalsRes, healthRes, financeRes, habitRes, todoRes, pomodoroRes, financeSettingsRes, depensesRes] = await Promise.all([
        pactId 
          ? supabase.from("goals").select("id, name, created_at, start_date, status, completion_date, difficulty, estimated_cost, potential_score, total_steps, validated_steps, goal_type, habit_duration_days, habit_checks").eq("pact_id", pactId)
          : Promise.resolve({ data: [] }),
        supabase.from("health_data").select("entry_date, sleep_hours, sleep_quality, wake_energy, mood_level, activity_level, movement_minutes, hydration_glasses, meal_balance, stress_level, mental_load, energy_morning, energy_afternoon, energy_evening").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(180),
        supabase.from("monthly_finance_validations").select("month, actual_total_income, actual_total_expenses, unplanned_income, unplanned_expenses").eq("user_id", user.id).not("validated_at", "is", null).order("month"),
        supabase.from("habit_logs").select("log_date, completed").eq("user_id", user.id).order("log_date", { ascending: false }).limit(400),
        supabase.from("todo_history").select("completed_at, task_name, priority, category, postpone_count, was_urgent").eq("user_id", user.id),
        supabase.from("pomodoro_sessions").select("duration_minutes, completed, completed_at, started_at, linked_goal_id, linked_todo_id, linked_step_id").eq("user_id", user.id).eq("completed", true),
        supabase.from("profiles").select("already_funded").eq("id", user.id).maybeSingle(),
        supabase.from("recurring_expenses").select("amount, category, is_active, periode_mois, mois_ancre, decalage_mois, montant_total, echeances").eq("user_id", user.id).eq("is_active", true),
      ]);

      const allGoals = goalsRes.data || [];

      // Dynamic XP calculation (same logic as useRankXP)
      let totalXP = 0;
      for (const g of allGoals as any[]) {
        const goalXP = g.potential_score || 0;
        if (g.status === "fully_completed" || g.status === "validated") {
          totalXP += goalXP;
        } else if (g.status === "in_progress") {
          // Une habitude n'a pas d'etapes : son total_steps recopie ses
          // habit_duration_days. Son avancement se lit dans habit_checks,
          // sinon un suivi de 180 jours a moitie tenu compte pour zero.
          const { total, completed } = avancementBrut(g);
          totalXP += Math.floor(goalXP * (completed / Math.max(1, total)) * 0.5);
        }
      }
      const goals = period === "all" 
        ? allGoals 
        : allGoals.filter((g: any) => new Date(g.created_at) >= start);
      const goalIds = goals.map((g: any) => g.id);
      const allGoalIds = allGoals.map((g: any) => g.id);

      // Showcase goals (with images, names) for visual gallery
      const showcaseRes = pactId
        ? await supabase
            .from("goals")
            .select("id, name, image_url, status, difficulty, potential_score, completion_date, total_steps, validated_steps, goal_type, habit_duration_days, habit_checks")
            .eq("pact_id", pactId)
            .order("created_at", { ascending: false })
            .limit(60)
        : { data: [] as any[] };
      const showcaseGoals = (showcaseRes.data || []) as any[];

      // Fetch steps, tags, cost items only for user's goals
      const [stepsRes, tagsRes, costItemsRes] = allGoalIds.length > 0
        ? await Promise.all([
            supabase.from("steps").select("id, goal_id, status, validated_at").in("goal_id", allGoalIds),
            supabase.from("goal_tags").select("goal_id, tag").in("goal_id", allGoalIds),
            supabase.from("goal_cost_items").select("goal_id, price, step_id").in("goal_id", allGoalIds),
          ])
        : [{ data: [] }, { data: [] }, { data: [] }];

      const allSteps = stepsRes.data || [];
      const steps = period === "all" 
        ? allSteps 
        : allSteps.filter((s: any) => goalIds.includes(s.goal_id));
      const tags = tagsRes.data || [];
      const costItems = costItemsRes.data || [];
      
      const allHealth = healthRes.data || [];
      const health = period === "all" 
        ? allHealth 
        : allHealth.filter((h: any) => new Date(h.entry_date) >= start);
      
      const finance = financeRes.data || [];
      const habits = habitRes.data || [];
      const allTodos = todoRes.data || [];
      const todos = period === "all"
        ? allTodos
        : allTodos.filter((t: any) => new Date(t.completed_at) >= start);
      
      const allPomodoros = pomodoroRes.data || [];
      const pomodoros = period === "all"
        ? allPomodoros
        : allPomodoros.filter((p: any) => new Date(p.completed_at || p.started_at) >= start);
      
      const alreadyFunded = financeSettingsRes.data?.already_funded ?? 0;

      // Goals over time (by month)
      const goalsByMonth = new Map<string, { created: number; completed: number }>();
      goals.forEach((g: any) => {
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
      goals.forEach((g: any) => {
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
      const filteredTags = tags.filter((t: any) => goalIds.includes(t.goal_id));
      filteredTags.forEach((t: any) => {
        tagCount.set(t.tag, (tagCount.get(t.tag) || 0) + 1);
      });
      const goalsByTag = Array.from(tagCount.entries()).map(([tag, count]) => ({
        tag,
        count,
        color: TAG_COLORS[tag] || "hsl(210, 30%, 50%)",
      }));

      // Steps statistics
      const totalSteps = steps.length;
      const completedSteps = steps.filter((s: any) => s.status === "completed").length;

      // Cost calculations (use all goals for total cost)
      const completedGoalIds = new Set(
        allGoals
          .filter((g: any) => ["completed", "fully_completed", "validated"].includes(g.status))
          .map((g: any) => g.id)
      );

      const totalCost = allGoals.reduce((sum: number, g: any) => sum + (g.estimated_cost || 0), 0);
      
      // Paid = completed goals' costs + already_funded
      const completedGoalsCost = allGoals
        .filter((g: any) => completedGoalIds.has(g.id))
        .reduce((sum: number, g: any) => sum + (g.estimated_cost || 0), 0);
      
      const paidCost = Math.min(completedGoalsCost + alreadyFunded, totalCost);
      const remainingCost = Math.max(totalCost - paidCost, 0);

      // Active goals
      const activeGoals = allGoals.filter((g: any) => 
        g.status === "in_progress" || g.status === "not_started"
      ).length;

      // Monthly burn rate calculation
      const monthsWithExpenses = allGoals.filter((g: any) => g.completion_date).length;
      const monthlyBurnRate = monthsWithExpenses > 0 
        ? Math.round(completedGoalsCost / Math.max(monthsWithExpenses, 1))
        : 0;

      // Health trend
      const healthTrend = health.map((h: any) => {
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
      const financeTrend = finance.map((f: any) => {
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

      (allGoals as any[])
        .filter((g) => g.goal_type === "habit" && Array.isArray(g.habit_checks) && g.created_at)
        .forEach((g) => {
          const depart = new Date(g.created_at);
          g.habit_checks.forEach((coche: boolean, i: number) => {
            const d = new Date(depart);
            d.setDate(d.getDate() + i);
            // Un jour a venir n'est ni tenu ni manque : il n'existe pas encore.
            if (d > new Date()) return;
            const cle = d.toISOString().split("T")[0];
            const e = habitByDate.get(cle) || { completed: 0, total: 0 };
            e.total++;
            if (coche) e.completed++;
            habitByDate.set(cle, e);
          });
        });

      habits.forEach((h: any) => {
        const entry = habitByDate.get(h.log_date) || { completed: 0, total: 0 };
        entry.total++;
        if (h.completed) entry.completed++;
        habitByDate.set(h.log_date, entry);
      });

      // Todo stats by month
      const todoByMonth = new Map<string, number>();
      todos.forEach((t: any) => {
        const m = t.completed_at?.slice(0, 7);
        if (m) todoByMonth.set(m, (todoByMonth.get(m) || 0) + 1);
      });

      // Pomodoro trend by day
      const pomodoroByDate = new Map<string, number>();
      pomodoros.forEach((p: any) => {
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
      goals
        .filter((g: any) => g.completion_date && (g.start_date || g.created_at))
        .forEach((g: any) => {
          const depart = parseISO(g.start_date || g.created_at);
          const days = differenceInDays(parseISO(g.completion_date), depart);
          if (days < 0) return;
          const month = g.completion_date.slice(0, 7);
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

      const completedGoals = goals.filter((g: any) => g.status === "fully_completed").length;
      const avgHealth = healthTrend.length ? healthTrend.reduce((a, h) => a + h.score, 0) / healthTrend.length : 0;
      const totalSaved = financeTrend.reduce((a, f) => a + f.savings, 0);
      const pomodoroMinutes = pomodoros.reduce((a: number, p: any) => a + (p.duration_minutes || 0), 0);

      // Compute trends (current period vs previous period)
      const prevGoals = period === "all" ? allGoals : allGoals.filter((g: any) => {
        const date = new Date(g.created_at);
        return date >= mid && date < start;
      });
      const prevCompletedGoals = prevGoals.filter((g: any) => g.status === "fully_completed").length;
      
      const prevHealth = period === "all" ? [] : allHealth.filter((h: any) => {
        const date = new Date(h.entry_date);
        return date >= mid && date < start;
      });
      const prevAvgHealth = prevHealth.length 
        ? prevHealth.map((h: any) => {
            const metrics = [h.sleep_quality, h.mood_level, h.activity_level].filter(Boolean) as number[];
            return metrics.length ? metrics.reduce((a, b) => a + b, 0) / metrics.length * 20 : 0;
          }).reduce((a, b) => a + b, 0) / prevHealth.length
        : 0;

      const prevPomodoros = period === "all" ? [] : allPomodoros.filter((p: any) => {
        const date = new Date(p.completed_at || p.started_at);
        return date >= mid && date < start;
      });
      const prevPomodoroMinutes = prevPomodoros.reduce((a: number, p: any) => a + (p.duration_minutes || 0), 0);

      const prevSteps = period === "all" ? [] : allSteps.filter((s: any) => {
        if (!s.validated_at) return false;
        const date = new Date(s.validated_at);
        return date >= mid && date < start;
      });
      const prevCompletedSteps = prevSteps.length;

      /* ═══════════════════════════════════════════════════════════
         LES LECTURES QUE LA COLLECTE ÉLARGIE PERMET.

         Toutes sortent de données déjà en base. Aucune n'invente une
         moyenne pour meubler : quand la matière manque, c'est le nombre
         de relevés qui est renvoyé, et le panneau le dit lui-même.
         ═══════════════════════════════════════════════════════════ */
      const todoLignes = (todoRes.data || []) as unknown as LigneTodo[];
      const sessions = (pomodoroRes.data || []) as unknown as LigneSession[];
      const sante = (healthRes.data || []) as unknown as LigneSante[];
      const depenses = (depensesRes.data || []) as unknown as LigneDepense[];

      /* ── COMBIEN DE FOIS IL A FALLU S'Y REMETTRE ──
         postpone_count est écrit à chaque report et suit la tâche
         jusqu'à son accomplissement. C'est la seule trace de ce qui a
         été difficile à commencer — et rien ne la lisait. */
      const parReports = new Map<number, number>();
      for (const l of todoLignes) {
        const r = Math.min(5, l.postpone_count || 0);
        parReports.set(r, (parReports.get(r) || 0) + 1);
      }
      const reports = Array.from(parReports.entries())
        .map(([reports, faites]) => ({ reports, faites }))
        .sort((a, b) => a.reports - b.reports);

      /* ── OÙ LE FOCUS EST RÉELLEMENT ALLÉ ──
         Une session porte l'objectif sur lequel elle a été lancée. On
         peut donc confronter les minutes PASSÉES à ce que le pacte
         annonce comme priorité — la seule mesure de l'application
         capable de contredire une intention. */
      const nomParObjectif = new Map<string, string>();
      for (const g of allGoals as { id: string; name?: string }[]) nomParObjectif.set(g.id, g.name || "Sans nom");
      const parObjectif = new Map<string, { minutes: number; sessions: number }>();
      for (const s of sessions) {
        if (!s.linked_goal_id) continue;
        const e = parObjectif.get(s.linked_goal_id) || { minutes: 0, sessions: 0 };
        e.minutes += s.duration_minutes || 0;
        e.sessions += 1;
        parObjectif.set(s.linked_goal_id, e);
      }
      const focusParObjectif = Array.from(parObjectif.entries())
        .map(([id, e]) => ({ id, nom: nomParObjectif.get(id) || "Objectif retiré", ...e }))
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 8);

      /* ── LES TÂCHES, PAR CATÉGORIE ET PAR DIFFICULTÉ ── */
      const parCategorie = new Map<string, number>();
      const parDifficulte = new Map<string, number>();
      for (const l of todoLignes) {
        const c = l.category || "general";
        parCategorie.set(c, (parCategorie.get(c) || 0) + 1);
        const d = l.priority || "medium";
        parDifficulte.set(d, (parDifficulte.get(d) || 0) + 1);
      }
      const tachesParCategorie = Array.from(parCategorie.entries())
        .map(([categorie, n]) => ({ categorie, n }))
        .sort((a, b) => b.n - a.n);
      const tachesParDifficulte = ["low", "medium", "high"]
        .map((niveau) => ({ niveau, n: parDifficulte.get(niveau) || 0 }))
        .filter((d) => d.n > 0);

      /* ── LA FORME DE L'ANNÉE QUI PRÉLÈVE ──
         Une dépense de cadence plurimensuelle ne tombe pas tous les
         mois : elle tombe aux mois congrus à son ancre. La charge n'est
         donc pas plate, et certains mois portent trois échéances quand
         d'autres n'en portent aucune. */
      const chargeParMois = Array.from({ length: 12 }, () => ({ montant: 0, lignes: 0 }));
      for (const d of depenses) {
        const periode = Math.max(1, d.periode_mois || 1);
        const montant = Number(d.montant_total ?? d.amount) || 0;
        const ancreMois = d.mois_ancre ? new Date(d.mois_ancre).getMonth() : ((d.decalage_mois || 0) % periode);
        for (let m = 0; m < 12; m++) {
          if (((m - ancreMois) % periode + periode) % periode !== 0) continue;
          chargeParMois[m].montant += montant;
          chargeParMois[m].lignes += 1;
        }
      }
      const anneeQuiPreleve = chargeParMois.map((c, mois) => ({ mois, ...c }));

      /* ── L'HEURE OÙ LES CHOSES SE FONT ──
         Les tâches portent leur heure d'accomplissement, les sessions
         leur heure de départ. Superposées, elles disent si le travail
         déclaré et le travail fait tombent au même moment. */
      const heures = Array.from({ length: 24 }, (_, heure) => ({ heure, taches: 0, focus: 0 }));
      for (const l of todoLignes) {
        if (!l.completed_at) continue;
        heures[new Date(l.completed_at).getHours()].taches += 1;
      }
      for (const s of sessions) {
        const d = s.started_at || s.completed_at;
        if (!d) continue;
        heures[new Date(d).getHours()].focus += 1;
      }
      const heureDOuvrage = heures;

      /* ── LES RUPTURES DE SÉRIE ──
         Un compteur dit la longueur d'une série ; il ne dit jamais OÙ
         elle s'est cassée. Une bande de jours le dit. */
      const parJour = new Map<string, number>();
      for (const l of todoLignes) {
        if (!l.completed_at) continue;
        const j = format(new Date(l.completed_at), "yyyy-MM-dd");
        parJour.set(j, (parJour.get(j) || 0) + 1);
      }
      const serieTaches = Array.from(parJour.entries())
        .map(([date, n]) => ({ date, n }))
        .sort((a, b) => a.date.localeCompare(b.date));

      /* ── LE SOMMEIL, EN HEURES ──
         La seule mesure de santé en unité réelle : les autres sont des
         notes de 1 à 5, celle-ci est un nombre d'heures. */
      const sommeil = sante
        .filter((h) => h.sleep_hours != null)
        .map((h) => ({ date: h.entry_date, heures: Number(h.sleep_hours) }))
        .sort((a, b) => a.date.localeCompare(b.date));

      /* ── LA JOURNÉE EN TROIS TEMPS ──
         Trois relevés valent mieux qu'une moyenne : ils disent À QUEL
         MOMENT la journée casse, ce qu'une moyenne efface. */
      const energieTroisTemps = sante
        .filter((h) => h.energy_morning != null || h.energy_afternoon != null || h.energy_evening != null)
        .map((h) => ({
          date: h.entry_date,
          matin: h.energy_morning ?? null,
          apresMidi: h.energy_afternoon ?? null,
          soir: h.energy_evening ?? null,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      /* ── PRÉVU CONTRE RÉEL ──
         L'imprévu est enregistré séparément du total : le prévu se
         retrouve donc par soustraction, et l'écart mesure une chose
         qu'on ne mesure jamais — la justesse d'une prévision. */
      const prevuReel = ((financeRes.data || []) as unknown as LigneMois[]).map((m) => ({
        month: m.month,
        reelDepenses: Number(m.actual_total_expenses) || 0,
        imprevuDepenses: Number(m.unplanned_expenses) || 0,
        reelRevenus: Number(m.actual_total_income) || 0,
        imprevuRevenus: Number(m.unplanned_income) || 0,
      }));

      const matiere = {
        relevesSante: sante.length,
        relevesEnergie: energieTroisTemps.length,
        nuitsMesurees: sommeil.length,
        moisValides: prevuReel.length,
        sessionsLiees: sessions.filter((s) => s.linked_goal_id).length,
      };

      return {
        reports,
        focusParObjectif,
        tachesParCategorie,
        tachesParDifficulte,
        anneeQuiPreleve,
        heureDOuvrage,
        serieTaches,
        sommeil,
        energieTroisTemps,
        prevuReel,
        matiere,
        goalsOverTime: Array.from(goalsByMonth.entries()).map(([month, d]) => ({ month, ...d })).sort((a, b) => a.month.localeCompare(b.month)),
        healthTrend,
        financeTrend,
        habitStreak: Array.from(habitByDate.entries()).map(([date, d]) => ({ date, ...d })).sort((a, b) => a.date.localeCompare(b.date)),
        todoStats: Array.from(todoByMonth.entries()).map(([month, completed]) => ({ month, completed })).sort((a, b) => a.month.localeCompare(b.month)),
        goalsByDifficulty,
        goalsByTag,
        pomodoroTrend,
        goalVelocity,
        summary: {
          totalGoals: goals.length,
          completedGoals,
          totalSteps,
          completedSteps,
          avgHealthScore: Math.round(avgHealth),
          totalSaved,
          currentStreak: 0,
          pomodoroMinutes,
          totalCost,
          paidCost,
          remainingCost,
          activeGoals,
          totalXP,
          monthlyBurnRate,
        },
        trends: {
          goalsCompleted: computeTrend(completedGoals, prevCompletedGoals),
          stepsCompleted: computeTrend(completedSteps, prevCompletedSteps),
          healthScore: computeTrend(Math.round(avgHealth), Math.round(prevAvgHealth)),
          focusMinutes: computeTrend(pomodoroMinutes, prevPomodoroMinutes),
        },
        goalShowcase: showcaseGoals.map((g: any) => ({
          id: g.id,
          name: g.name || "Sans nom",
          image_url: g.image_url || null,
          status: g.status || "not_started",
          difficulty: g.difficulty || "easy",
          potential_score: g.potential_score || 0,
          completion_date: g.completion_date || null,
          progress: (() => {
            const a = avancementBrut(g);
            return a.total > 0 ? Math.round((a.completed / a.total) * 100) : 0;
          })(),
        })),
        topGoals: showcaseGoals
          .filter((g: any) => ["fully_completed", "validated"].includes(g.status))
          .sort((a: any, b: any) => (b.potential_score || 0) - (a.potential_score || 0))
          .slice(0, 5)
          .map((g: any) => ({
            id: g.id,
            name: g.name || "Sans nom",
            image_url: g.image_url || null,
            difficulty: g.difficulty || "easy",
            potential_score: g.potential_score || 0,
            completion_date: g.completion_date || null,
          })),
      };
    },
    enabled: !!user?.id,
  });
}
