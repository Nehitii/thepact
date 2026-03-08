import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WeeklyReview {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  goals_progressed: number;
  steps_completed: number;
  health_avg_score: number | null;
  finance_net: number | null;
  journal_entries_count: number;
  todo_completed: number;
  ai_insights: string | null;
  reflection_note: string | null;
  week_rating: number | null;
  created_at: string;
}

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  // Use local date formatting to avoid UTC timezone shift
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return {
    weekStart: fmt(weekStart),
    weekEnd: fmt(weekEnd),
  };
}

export function useWeeklyReviews() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["weekly-reviews", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from("weekly_reviews")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data || []) as WeeklyReview[];
    },
    enabled: !!user?.id,
  });
}

export function useCurrentWeekReview() {
  const { user } = useAuth();
  const { weekStart } = getWeekBounds();

  return useQuery({
    queryKey: ["weekly-review-current", user?.id, weekStart],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await (supabase as any)
        .from("weekly_reviews")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start", weekStart)
        .maybeSingle();
      if (error) throw error;
      return data as WeeklyReview | null;
    },
    enabled: !!user?.id,
  });
}

export function useGenerateWeeklyReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("weekly-review", {
        body: { user_id: user.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-review-current"] });
    },
  });
}

export function useSaveWeeklyReflection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, reflection_note, week_rating }: { reviewId: string; reflection_note: string; week_rating: number }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await (supabase as any)
        .from("weekly_reviews")
        .update({ reflection_note, week_rating, updated_at: new Date().toISOString() })
        .eq("id", reviewId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-review-current"] });
    },
  });
}
