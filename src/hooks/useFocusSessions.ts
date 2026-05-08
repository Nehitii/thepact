import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FocusSession {
  id: string;
  user_id: string;
  goal_id: string | null;
  duration_minutes: number;
  notes: string | null;
  started_at: string;
  ended_at: string;
  created_at: string;
}

export function useFocusSessions(limit = 50) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["focus-sessions", user?.id, limit],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("focus_sessions" as any)
        .select("*")
        .order("started_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as FocusSession[];
    },
  });
}

export function useLogFocusSession() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      duration_minutes: number;
      goal_id?: string | null;
      notes?: string | null;
      started_at?: string;
      ended_at?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("focus_sessions" as any)
        .insert({
          user_id: user.id,
          duration_minutes: input.duration_minutes,
          goal_id: input.goal_id ?? null,
          notes: input.notes ?? null,
          started_at: input.started_at ?? new Date().toISOString(),
          ended_at: input.ended_at ?? new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as FocusSession;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["focus-sessions"] });
      qc.invalidateQueries({ queryKey: ["daily-quests"] });
    },
  });
}