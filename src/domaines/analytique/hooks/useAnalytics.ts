import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { useAuth } from "@/socle/contextes/AuthContext";
import { subDays, subMonths, format, parseISO, differenceInDays } from "date-fns";
import { lecturesElargies } from "@/domaines/analytique/logique/lecturesElargies";
import type { AnalyticsPeriod } from "@/domaines/analytique/types";
import type {
  LigneObjectif, LigneVitrine, LigneEtape, LigneTag, LignePiece, LigneHabitude,
  LigneTodo, LigneSession, LigneSante, LigneDepense, LigneMois,
} from "@/domaines/analytique/types";
import type {
  GoalsByDifficulty, GoalsByTag, TrendData, Reports, FocusParObjectif, HeureDOuvrage, PrevuReel, AnalyticsData, AvancementLisible,
} from "@/domaines/analytique/types";
/* Reexportes : les appelants importaient ces formes depuis ce hook. */
export type {
  GoalsByDifficulty, GoalsByTag, TrendData, Reports, FocusParObjectif, HeureDOuvrage, PrevuReel, AnalyticsData, AvancementLisible,
};




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

/* LES LIGNES TELLES QU'ELLES ARRIVENT.
   Une interface par `.select()`, avec exactement ses colonnes : demander
   un champ qui n'a pas ete lu devient une erreur de compilation, au lieu
   d'un `undefined` qui traverse tout le calcul et ressort en zero. */






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


function avancementBrut(g: AvancementLisible): { total: number; completed: number } {
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
    queryKey: ["analytics-dashboard", "v3", user?.id, period],
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
      const [goalsRes, healthRes, financeRes, habitRes, todoRes, pomodoroRes, financeSettingsRes, depensesRes, agendaRes, echeancesRes] = await Promise.all([
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
        supabase.from("calendar_events").select("start_time").eq("user_id", user.id),
        supabase.from("todo_tasks").select("deadline").eq("user_id", user.id).not("deadline", "is", null),
      ]);

      const allGoals = (goalsRes.data ?? []) as LigneObjectif[];

      // Dynamic XP calculation (same logic as useRankXP)
      let totalXP = 0;
      for (const g of allGoals) {
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
        : allGoals.filter((g) => new Date(g.created_at) >= start);
      const goalIds = goals.map((g) => g.id);
      const allGoalIds = allGoals.map((g) => g.id);

      // Showcase goals (with images, names) for visual gallery
      const showcaseRes = pactId
        ? await supabase
            .from("goals")
            .select("id, name, image_url, status, difficulty, potential_score, completion_date, total_steps, validated_steps, goal_type, habit_duration_days, habit_checks")
            .eq("pact_id", pactId)
            .order("created_at", { ascending: false })
            .limit(60)
        : { data: [] };
      const showcaseGoals = (showcaseRes.data ?? []) as LigneVitrine[];

      // Fetch steps, tags, cost items only for user's goals
      const [stepsRes, tagsRes, costItemsRes] = allGoalIds.length > 0
        ? await Promise.all([
            supabase.from("steps").select("id, goal_id, status, validated_at").in("goal_id", allGoalIds),
            supabase.from("goal_tags").select("goal_id, tag").in("goal_id", allGoalIds),
            supabase.from("goal_cost_items").select("goal_id, price, step_id").in("goal_id", allGoalIds),
          ])
        : [{ data: [] }, { data: [] }, { data: [] }];

      const allSteps = (stepsRes.data ?? []) as LigneEtape[];
      const steps = period === "all" 
        ? allSteps 
        : allSteps.filter((s) => goalIds.includes(s.goal_id));
      const tags = (tagsRes.data ?? []) as LigneTag[];
      const costItems = (costItemsRes.data ?? []) as LignePiece[];
      
      const allHealth = healthRes.data || [];
      const health = period === "all" 
        ? allHealth 
        : allHealth.filter((h) => new Date(h.entry_date) >= start);
      
      const finance = financeRes.data || [];
      const habits = habitRes.data || [];
      const allTodos = todoRes.data || [];
      const todos = period === "all"
        ? allTodos
        : allTodos.filter((t) => new Date(t.completed_at) >= start);
      
      const allPomodoros = pomodoroRes.data || [];
      const pomodoros = period === "all"
        ? allPomodoros
        : allPomodoros.filter((p) => new Date(p.completed_at || p.started_at) >= start);
      
      const alreadyFunded = financeSettingsRes.data?.already_funded ?? 0;

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
            if (d > new Date()) return;
            const cle = d.toISOString().split("T")[0];
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

      const completedGoals = goals.filter((g) => g.status === "fully_completed").length;
      const avgHealth = healthTrend.length ? healthTrend.reduce((a, h) => a + h.score, 0) / healthTrend.length : 0;
      const totalSaved = financeTrend.reduce((a, f) => a + f.savings, 0);
      const pomodoroMinutes = pomodoros.reduce((a, p) => a + (p.duration_minutes || 0), 0);

      // Compute trends (current period vs previous period)
      const prevGoals = period === "all" ? allGoals : allGoals.filter((g) => {
        const date = new Date(g.created_at);
        return date >= mid && date < start;
      });
      const prevCompletedGoals = prevGoals.filter((g) => g.status === "fully_completed").length;
      
      const prevHealth = period === "all" ? [] : allHealth.filter((h) => {
        const date = new Date(h.entry_date);
        return date >= mid && date < start;
      });
      const prevAvgHealth = prevHealth.length 
        ? prevHealth.map((h) => {
            const metrics = [h.sleep_quality, h.mood_level, h.activity_level].filter(Boolean) as number[];
            return metrics.length ? metrics.reduce((a, b) => a + b, 0) / metrics.length * 20 : 0;
          }).reduce((a, b) => a + b, 0) / prevHealth.length
        : 0;

      const prevPomodoros = period === "all" ? [] : allPomodoros.filter((p) => {
        const date = new Date(p.completed_at || p.started_at);
        return date >= mid && date < start;
      });
      const prevPomodoroMinutes = prevPomodoros.reduce((a, p) => a + (p.duration_minutes || 0), 0);

      const prevSteps = period === "all" ? [] : allSteps.filter((s) => {
        if (!s.validated_at) return false;
        const date = new Date(s.validated_at);
        return date >= mid && date < start;
      });
      const prevCompletedSteps = prevSteps.length;

      /* LES LECTURES ELARGIES, DOUZE COMPTAGES, TOUS PURS.
         Le hook dit maintenant ce qu il leur donne — c est la seule
         chose que le lecteur avait besoin de savoir, et c est
         exactement ce que la portee partagee lui cachait. */
      const {
        reports, focusParObjectif, tachesParCategorie, tachesParDifficulte,
        anneeQuiPreleve, heureDOuvrage, serieTaches, cequiTombe,
        sommeil, energieTroisTemps, prevuReel, matiere,
      } = lecturesElargies({
        taches: (todoRes.data || []) as unknown as LigneTodo[],
        sessions: (pomodoroRes.data || []) as unknown as LigneSession[],
        sante: (healthRes.data || []) as unknown as LigneSante[],
        depenses: (depensesRes.data || []) as unknown as LigneDepense[],
        mois: (financeRes.data || []) as unknown as LigneMois[],
        agenda: (agendaRes.data || []) as { start_time: string | null }[],
        echeances: (echeancesRes.data || []) as { deadline: string | null }[],
        objectifs: allGoals as { id: string; name?: string }[],
      });
      return {
        reports,
        focusParObjectif,
        tachesParCategorie,
        tachesParDifficulte,
        anneeQuiPreleve,
        heureDOuvrage,
        serieTaches,
        cequiTombe,
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
        goalShowcase: showcaseGoals.map((g) => ({
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
          .filter((g) => ["fully_completed", "validated"].includes(g.status ?? ""))
          .sort((a, b) => (b.potential_score || 0) - (a.potential_score || 0))
          .slice(0, 5)
          .map((g) => ({
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
