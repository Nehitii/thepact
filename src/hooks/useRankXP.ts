import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useGoals } from "./useGoals";
import type { Rank } from "@/types/ranks";

export type { Rank };

export interface RankXPData {
  ranks: Rank[];
  currentRank: Rank | null;
  nextRank: Rank | null;
  currentXP: number;
  totalMaxXP: number;
  xpToNextRank: number;
  progressInCurrentRank: number;
  globalProgress: number;
}

export function useRankXP(userId: string | undefined, pactId: string | undefined) {
  const { data: goals } = useGoals(pactId, { includeStepCounts: true });

  return useQuery({
    queryKey: ["rank-xp", userId, pactId, goals?.length, goals?.map(g => g.potential_score).join(',')],
    queryFn: async (): Promise<RankXPData> => {
      if (!userId) {
        return { ranks: [], currentRank: null, nextRank: null, currentXP: 0, totalMaxXP: 0, xpToNextRank: 0, progressInCurrentRank: 0, globalProgress: 0 };
      }

      const { data: ranksData, error } = await supabase
        .from("ranks")
        .select("*")
        .eq("user_id", userId)
        .order("min_points", { ascending: true });

      if (error) throw error;
      const ranks: Rank[] = ranksData || [];

      const totalMaxXP = goals?.reduce((sum, g) => sum + (g.potential_score || 0), 0) || 0;

      let currentXP = 0;
      if (goals) {
        for (const goal of goals) {
          const goalXP = goal.potential_score || 0;
          if (goal.status === "fully_completed" || goal.status === "validated") {
            currentXP += goalXP;
          } else if (goal.status === "in_progress") {
            const totalSteps = goal.totalStepsCount || goal.total_steps || 1;
            const completedSteps = goal.completedStepsCount || goal.validated_steps || 0;
            currentXP += Math.floor(goalXP * (completedSteps / totalSteps) * 0.5);
          }
        }
      }
      currentXP = Math.min(currentXP, totalMaxXP);

      let currentRank: Rank | null = null;
      let nextRank: Rank | null = null;
      for (let i = 0; i < ranks.length; i++) {
        if (currentXP >= ranks[i].min_points) {
          currentRank = ranks[i];
          nextRank = ranks[i + 1] || null;
        } else break;
      }

      // No fallback — if no ranks defined, currentRank stays null

      const currentRankMin = currentRank?.min_points || 0;
      const nextRankMin = nextRank?.min_points || totalMaxXP || currentRankMin + 1000;
      const xpInRank = Math.max(0, currentXP - currentRankMin);
      const xpNeeded = nextRankMin - currentRankMin;
      const progressInCurrentRank = xpNeeded > 0 ? Math.min(100, (xpInRank / xpNeeded) * 100) : 100;
      const xpToNextRank = Math.max(0, nextRankMin - currentXP);
      const globalProgress = totalMaxXP > 0 ? Math.min(100, (currentXP / totalMaxXP) * 100) : 0;

      return { ranks, currentRank, nextRank, currentXP, totalMaxXP, xpToNextRank, progressInCurrentRank, globalProgress };
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}
