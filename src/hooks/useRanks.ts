import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Rank interface representing a user-defined rank tier.
 * Includes custom styling properties for visual display.
 */
export interface Rank {
  id: string;
  min_points: number;
  max_points?: number | null;
  name: string;
  logo_url?: string | null;
  background_url?: string | null;
  background_opacity?: number | null;
  frame_color?: string | null;
  glow_color?: string | null;
  quote?: string | null;
}

export function useRanks(userId: string | undefined) {
  return useQuery({
    queryKey: ["ranks", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("ranks")
        .select("*")
        .eq("user_id", userId)
        .order("min_points", { ascending: true });

      if (error) throw error;
      return (data || []) as Rank[];
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });
}
