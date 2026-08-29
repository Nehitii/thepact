import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { useAuth } from "@/socle/contextes/AuthContext";
import { subDays, subMonths, format, parseISO, differenceInDays } from "date-fns";
import { comparerALaPeriodePrecedente, getPeriodDates } from "@/domaines/analytique/logique/tendances";
import { etatDuPacte } from "@/domaines/analytique/logique/etatDuPacte";
import { courbesDuTemps } from "@/domaines/analytique/logique/courbesDuTemps";
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

      /* L ETAT DU PACTE, sorti dans `logique/etatDuPacte.ts` avec ses
         deux tables de couleurs. */
      const {
        goalsOverTime, goalsByDifficulty, goalsByTag, totalSteps, completedSteps,
        totalCost, paidCost, remainingCost, activeGoals, monthlyBurnRate,
      } = etatDuPacte({
        objectifs: goals, tousLesObjectifs: allGoals, etapes: steps,
        etiquettes: tags, dejaFinance: alreadyFunded,
      });

      /* LES SIX COURBES DU TEMPS, sorties dans `logique/courbesDuTemps.ts`. */
      const { healthTrend, financeTrend, goalVelocity, pomodoroTrend, habitStreak, todoStats } =
        courbesDuTemps({
          sante: health, finance, objectifs: allGoals, objectifsDeLaPeriode: goals, habitudes: habits,
          taches: todos, sessions: pomodoros,
        });

      const completedGoals = goals.filter((g) => g.status === "fully_completed").length;
      const avgHealth = healthTrend.length ? healthTrend.reduce((a, h) => a + h.score, 0) / healthTrend.length : 0;
      const totalSaved = financeTrend.reduce((a, f) => a + f.savings, 0);
      const pomodoroMinutes = pomodoros.reduce((a, p) => a + (p.duration_minutes || 0), 0);

      /* LA COMPARAISON A LA PERIODE PRECEDENTE, sortie dans
         `logique/tendances.ts` avec les deux bornes et `computeTrend`. */
      const tendancesDeLaPeriode = comparerALaPeriodePrecedente({
        periode: period, debut: start, milieu: mid,
        tousLesObjectifs: allGoals, toutesLesEtapes: allSteps,
        tousLesReleves: allHealth, toutesLesSessions: allPomodoros,
        objectifsFranchis: completedGoals,
        etapesValidees: completedSteps,
        scoreSante: Math.round(avgHealth),
        minutesDeFocus: pomodoroMinutes,
      });

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
        goalsOverTime,
        healthTrend,
        financeTrend,
        habitStreak,
        todoStats,
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
        trends: tendancesDeLaPeriode,
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
