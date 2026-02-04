/**
 * Pact data hook.
 * 
 * A "pact" represents a user's commitment/project in the app.
 * Each user has one active pact containing their goals and progress.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
export interface Pact {
  id: string;
  name: string;
  mantra: string;
  symbol: string;
  color: string;
  points: number;
  tier: number;
  global_progress: number;
  project_start_date?: string | null;
  project_end_date?: string | null;
  created_at?: string | null;
}

export function usePact(userId: string | undefined) {
  return useQuery({
    queryKey: ["pact", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("pacts")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as Pact | null;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
