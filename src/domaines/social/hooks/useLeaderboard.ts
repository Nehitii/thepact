import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  points: number;
  goals_completed: number;
  rank_name: string | null;
}

export function useLeaderboard(limit = 50) {
  return useQuery({
    queryKey: ["leaderboard", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_leaderboard", {
        p_limit: limit,
      });
      if (error) throw error;
      return (data || []) as LeaderboardEntry[];
    },
  });
}
