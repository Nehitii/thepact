import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Rank {
  id: string;
  min_points: number;
  name: string;
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
