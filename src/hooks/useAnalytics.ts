import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

export interface AnalyticsData {
  goalsOverTime: { month: string; created: number; completed: number }[];
  healthTrend: { date: string; score: number }[];
  financeTrend: { month: string; income: number; expenses: number; savings: number }[];
  habitStreak: { date: string; completed: number; total: number }[];
  todoStats: { month: string; completed: number }[];
  goalsByDifficulty: GoalsByDifficulty[];
  goalsByTag: GoalsByTag[];
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

export function useAnalytics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["analytics-dashboard", user?.id],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!user?.id) throw new Error("Not authenticated");

      // Parallel fetch all data
      const [goalsRes, stepsRes, tagsRes, costItemsRes, healthRes, financeRes, habitRes, todoRes, pomodoroRes, pactRes, financeSettingsRes] = await Promise.all([
        supabase.from("goals").select("id, created_at, status, completion_date, difficulty, estimated_cost"),
        supabase.from("steps").select("id, goal_id, status"),
        supabase.from("goal_tags").select("goal_id, tag"),
        supabase.from("goal_cost_items").select("goal_id, price, step_id"),
        supabase.from("health_data").select("entry_date, sleep_quality, mood_level, activity_level, hydration_glasses, meal_balance, stress_level").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(90),
        supabase.from("finance").select("month, income, fixed_expenses, variable_expenses, savings").eq("user_id", user.id).order("month"),
        (supabase as any).from("habit_logs").select("log_date, completed").eq("user_id", user.id).order("log_date", { ascending: false }).limit(200),
        supabase.from("todo_history").select("completed_at").eq("user_id", user.id),
        (supabase as any).from("pomodoro_sessions").select("duration_minutes, completed, completed_at").eq("user_id", user.id).eq("completed", true),
        supabase.from("pacts").select("points").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("already_funded").eq("id", user.id).maybeSingle(),
      ]);

      const goals = goalsRes.data || [];
      const steps = stepsRes.data || [];
      const tags = tagsRes.data || [];
      const costItems = costItemsRes.data || [];
      const health = healthRes.data || [];
      const finance = financeRes.data || [];
      const habits = habitRes.data || [];
      const todos = todoRes.data || [];
      const pomodoros = pomodoroRes.data || [];
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
      tags.forEach((t: any) => {
        tagCount.set(t.tag, (tagCount.get(t.tag) || 0) + 1);
      });
      const goalsByTag = Array.from(tagCount.entries()).map(([tag, count]) => ({
        tag,
        count,
        color: TAG_COLORS[tag] || "hsl(210, 30%, 50%)",
      }));

      // Steps statistics
      const totalSteps = steps.length;
      const completedSteps = steps.filter((s: any) => s.status === "validated").length;

      // Cost calculations
      const completedGoalIds = new Set(
        goals
          .filter((g: any) => ["completed", "fully_completed", "validated"].includes(g.status))
          .map((g: any) => g.id)
      );
      const completedStepIds = new Set(
        steps.filter((s: any) => s.status === "validated").map((s: any) => s.id)
      );

      const totalCost = goals.reduce((sum: number, g: any) => sum + (g.estimated_cost || 0), 0);
      
      // Paid = completed goals' costs + cost items linked to completed steps + already_funded
      const completedGoalsCost = goals
        .filter((g: any) => completedGoalIds.has(g.id))
        .reduce((sum: number, g: any) => sum + (g.estimated_cost || 0), 0);
      
      const paidCost = Math.min(completedGoalsCost + alreadyFunded, totalCost);
      const remainingCost = Math.max(totalCost - paidCost, 0);

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
        goalsByDifficulty,
        goalsByTag,
        summary: {
          totalGoals: goals.length,
          completedGoals,
          totalSteps,
          completedSteps,
          avgHealthScore: Math.round(avgHealth),
          totalSaved,
          currentStreak: 0,
          pomodoroMinutes: pomodoros.reduce((a: number, p: any) => a + (p.duration_minutes || 0), 0),
          totalCost,
          paidCost,
          remainingCost,
        },
      };
    },
    enabled: !!user?.id,
  });
}
