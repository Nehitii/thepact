import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { TablesUpdate } from "@/integrations/supabase/types";

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
  /* Ce que la personne se promet pour la semaine suivante. C'est la
     seule chose qu'une revue lègue à la suivante — sans elle, chaque
     semaine repart de zéro et le rituel ne s'enchaîne jamais. */
  next_intention: string | null;
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
    /* ON N'ÉCRIT QUE CE QU'ON A REÇU. Les trois temps du rituel
       s'enregistrent séparément : passer les trois champs à chaque
       fois écraserait de vraies réponses par des chaînes vides dès
       qu'on n'en remplit qu'un. */
    mutationFn: async ({ reviewId, reflection_note, week_rating, next_intention }: {
      reviewId: string;
      reflection_note?: string | null;
      week_rating?: number | null;
      next_intention?: string | null;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const patch: TablesUpdate<"weekly_reviews"> = { updated_at: new Date().toISOString() };
      if (reflection_note !== undefined) patch.reflection_note = reflection_note;
      if (week_rating !== undefined) patch.week_rating = week_rating;
      if (next_intention !== undefined) patch.next_intention = next_intention;

      const { error } = await supabase
        .from("weekly_reviews")
        .update(patch)
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
