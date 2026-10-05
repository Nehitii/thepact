import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FocusDistraction {
  id: string;
  user_id: string;
  session_id: string | null;
  note: string;
  category: string | null;
  logged_at: string;
}

export function useFocusDistractions(limit = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["focus-distractions", user?.id, limit],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("focus_distractions" as any)
        .select("*")
        .order("logged_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as FocusDistraction[];
    },
  });
}

export function useLogFocusDistraction() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { note: string; category?: string | null; session_id?: string | null }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("focus_distractions" as any)
        .insert({
          user_id: user.id,
          note: input.note,
          category: input.category ?? null,
          session_id: input.session_id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as FocusDistraction;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["focus-distractions"] });
    },
  });
}