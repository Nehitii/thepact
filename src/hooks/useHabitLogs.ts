import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface HabitLog {
  id: string;
  user_id: string;
  goal_id: string;
  log_date: string;
  completed: boolean;
  streak_count: number;
  bond_reward: number;
  created_at: string;
}

export function useHabitLogs(goalId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["habit-logs", user?.id, goalId],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = (supabase as any)
        .from("habit_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false });

      if (goalId) query = query.eq("goal_id", goalId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as HabitLog[];
    },
    enabled: !!user?.id,
  });
}

export function useAllHabitLogs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["habit-logs-all", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Get last 365 days of logs
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);

      const { data, error } = await (supabase as any)
        .from("habit_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("log_date", yearAgo.toISOString().split("T")[0])
        .order("log_date", { ascending: true });
      if (error) throw error;
      return (data || []) as HabitLog[];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}

export function useToggleHabitLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, date }: { goalId: string; date: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Check if log exists
      const { data: existing } = await (supabase as any)
        .from("habit_logs")
        .select("id, completed")
        .eq("user_id", user.id)
        .eq("goal_id", goalId)
        .eq("log_date", date)
        .maybeSingle();

      if (existing) {
        // Toggle
        const { error } = await (supabase as any)
          .from("habit_logs")
          .update({ completed: !existing.completed })
          .eq("id", existing.id);
        if (error) throw error;
        return !existing.completed;
      } else {
        // Calculate streak
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        const { data: prevLog } = await (supabase as any)
          .from("habit_logs")
          .select("streak_count")
          .eq("user_id", user.id)
          .eq("goal_id", goalId)
          .eq("log_date", yesterday.toISOString().split("T")[0])
          .eq("completed", true)
          .maybeSingle();

        const streakCount = (prevLog?.streak_count || 0) + 1;
        // Streak multiplier: 1 bond per day, +1 every 7 days of streak
        const bondReward = 1 + Math.floor(streakCount / 7);

        const { error } = await (supabase as any)
          .from("habit_logs")
          .insert({
            user_id: user.id,
            goal_id: goalId,
            log_date: date,
            completed: true,
            streak_count: streakCount,
            bond_reward: bondReward,
          });
        if (error) throw error;
        return true;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["habit-logs-all"] });
    },
  });
}

// Compute heatmap data from logs
export function computeHeatmapData(logs: HabitLog[]) {
  const map = new Map<string, { count: number; completed: boolean }>();
  for (const log of logs) {
    if (log.completed) {
      const existing = map.get(log.log_date);
      map.set(log.log_date, {
        count: (existing?.count || 0) + 1,
        completed: true,
      });
    }
  }
  return map;
}

// Compute current streak across all habits
export function computeCurrentStreak(logs: HabitLog[]): number {
  const today = new Date().toISOString().split("T")[0];
  const completedDates = new Set(
    logs.filter((l) => l.completed).map((l) => l.log_date)
  );

  let streak = 0;
  const d = new Date(today);

  // Check today first
  if (!completedDates.has(today)) {
    // Check yesterday (grace: user might not have logged yet today)
    d.setDate(d.getDate() - 1);
  }

  while (completedDates.has(d.toISOString().split("T")[0])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return streak;
}
