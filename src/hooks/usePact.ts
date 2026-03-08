/**
 * Pact data hook.
 * 
 * A "pact" represents a user's commitment/project in the app.
 * Respects active_pact_id from profile if set (for shared pacts).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  title_font?: string | null;
  title_effect?: string | null;
}

export function usePact(userId: string | undefined) {
  return useQuery({
    queryKey: ["pact", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Check if user has an active_pact_id preference
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_pact_id")
        .eq("id", userId)
        .single();

      const activePactId = (profile as any)?.active_pact_id;

      if (activePactId) {
        // Load the chosen pact (could be personal or shared)
        const { data, error } = await supabase
          .from("pacts")
          .select("*")
          .eq("id", activePactId)
          .maybeSingle();
        if (error) throw error;
        if (data) return data as Pact;
      }

      // Fallback: load personal pact
      const { data, error } = await supabase
        .from("pacts")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as Pact | null;
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}
