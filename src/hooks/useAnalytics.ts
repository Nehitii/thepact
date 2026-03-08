import { useQuery } from "@tanstack/react-query";
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

export function useAnalytics(period: AnalyticsPeriod = "all") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["analytics-dashboard", user?.id, period],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!user?.id) throw new Error("Not authenticated");

      const { start, mid } = getPeriodDates(period);
      const startStr = format(start, "yyyy-MM-dd");
      const midStr = format(mid, "yyyy-MM-dd");

      // First get user's pact to filter goals
      const { data: pactData } = await supabase
        .from("pacts")
        .select("id, points")
        .eq("user_id", user.id)
        .maybeSingle();

      const pactId = pactData?.id;
      const totalXP = pactData?.points ?? 0;

      // Parallel fetch all data - filter goals by pact_id
      const [goalsRes, healthRes, financeRes, habitRes, todoRes, pomodoroRes, financeSettingsRes] = await Promise.all([
        pactId 
          ? supabase.from("goals").select("id, created_at, status, completion_date, difficulty, estimated_cost").eq("pact_id", pactId)
          : Promise.resolve({ data: [] }),
        supabase.from("health_data").select("entry_date, sleep_quality, mood_level, activity_level, hydration_glasses, meal_balance, stress_level").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(180),
        supabase.from("finance").select("month, income, fixed_expenses, variable_expenses, savings").eq("user_id", user.id).order("month"),
        (supabase as any).from("habit_logs").select("log_date, completed").eq("user_id", user.id).order("log_date", { ascending: false }).limit(400),
        supabase.from("todo_history").select("completed_at").eq("user_id", user.id),
        (supabase as any).from("pomodoro_sessions").select("duration_minutes, completed, completed_at, started_at").eq("user_id", user.id).eq("completed", true),
        supabase.from("profiles").select("already_funded").eq("id", user.id).maybeSingle(),
      ]);

      const allGoals = goalsRes.data || [];
      const goals = period === "all" 
        ? allGoals 
        : allGoals.filter((g: any) => new Date(g.created_at) >= start);
      const goalIds = goals.map((g: any) => g.id);
      const allGoalIds = allGoals.map((g: any) => g.id);

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

      // Finance trend
      const financeTrend = finance.map((f: any) => ({
        month: f.month?.slice(0, 7),
        income: Number(f.income || 0),
        expenses: Number(f.fixed_expenses || 0) + Number(f.variable_expenses || 0),
        savings: Number(f.savings || 0),
      }));

      // Habit completion rate by week
      const habitByDate = new Map<string, { completed: number; total: number }>();
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
      const goalVelocityByMonth = new Map<string, { totalDays: number; count: number }>();
      goals
        .filter((g: any) => g.completion_date && g.created_at)
        .forEach((g: any) => {
          const month = g.completion_date.slice(0, 7);
          const days = differenceInDays(parseISO(g.completion_date), parseISO(g.created_at));
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

      return {
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
      };
    },
    enabled: !!user?.id,
  });
}
