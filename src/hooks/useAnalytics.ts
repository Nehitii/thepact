import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AnalyticsData {
  goalsOverTime: { month: string; created: number; completed: number }[];
  healthTrend: { date: string; score: number }[];
  financeTrend: { month: string; income: number; expenses: number; savings: number }[];
  habitStreak: { date: string; completed: number; total: number }[];
  todoStats: { month: string; completed: number }[];
  summary: {
    totalGoals: number;
    completedGoals: number;
    avgHealthScore: number;
    totalSaved: number;
    currentStreak: number;
    pomodoroMinutes: number;
  };
}

export function useAnalytics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["analytics-dashboard", user?.id],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!user?.id) throw new Error("Not authenticated");

      // Parallel fetch all data
      const [goalsRes, healthRes, financeRes, habitRes, todoRes, pomodoroRes, pactRes] = await Promise.all([
        supabase.from("goals").select("created_at, status, completion_date").order("created_at"),
        supabase.from("health_data").select("entry_date, sleep_quality, mood_level, activity_level, hydration_glasses, meal_balance, stress_level").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(90),
        supabase.from("finance").select("month, income, fixed_expenses, variable_expenses, savings").eq("user_id", user.id).order("month"),
        (supabase as any).from("habit_logs").select("log_date, completed").eq("user_id", user.id).order("log_date", { ascending: false }).limit(200),
        supabase.from("todo_history").select("completed_at").eq("user_id", user.id),
        (supabase as any).from("pomodoro_sessions").select("duration_minutes, completed, completed_at").eq("user_id", user.id).eq("completed", true),
        supabase.from("pacts").select("points").eq("user_id", user.id).maybeSingle(),
      ]);

      const goals = goalsRes.data || [];
      const health = healthRes.data || [];
      const finance = financeRes.data || [];
      const habits = habitRes.data || [];
      const todos = todoRes.data || [];
      const pomodoros = pomodoroRes.data || [];

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

      const completedGoals = goals.filter((g: any) => g.status === "fully_completed").length;
      const avgHealth = healthTrend.length ? healthTrend.reduce((a, h) => a + h.score, 0) / healthTrend.length : 0;
      const totalSaved = financeTrend.reduce((a, f) => a + f.savings, 0);

      return {
        goalsOverTime: Array.from(goalsByMonth.entries()).map(([month, d]) => ({ month, ...d })).sort((a, b) => a.month.localeCompare(b.month)),
        healthTrend,
        financeTrend,
        habitStreak: Array.from(habitByDate.entries()).map(([date, d]) => ({ date, ...d })).sort((a, b) => a.date.localeCompare(b.date)),
        todoStats: Array.from(todoByMonth.entries()).map(([month, completed]) => ({ month, completed })).sort((a, b) => a.month.localeCompare(b.month)),
        summary: {
          totalGoals: goals.length,
          completedGoals,
          avgHealthScore: Math.round(avgHealth),
          totalSaved,
          currentStreak: 0,
          pomodoroMinutes: pomodoros.reduce((a: number, p: any) => a + (p.duration_minutes || 0), 0),
        },
      };
    },
    enabled: !!user?.id,
  });
}
