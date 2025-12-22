import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useGoals } from "./useGoals";

// XP values per difficulty
const DIFFICULTY_XP: Record<string, number> = {
  easy: 50,
  medium: 100,
  hard: 200,
  extreme: 400,
  impossible: 800,
  custom: 150,
};

export interface Rank {
  id: string;
  min_points: number;
  max_points?: number;
  name: string;
  logo_url?: string | null;
  background_url?: string | null;
  background_opacity?: number;
  frame_color?: string;
  glow_color?: string;
  quote?: string | null;
}

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
    queryKey: ["rank-xp", userId, pactId, goals?.length],
    queryFn: async (): Promise<RankXPData> => {
      if (!userId) {
        return {
          ranks: [],
          currentRank: null,
          nextRank: null,
          currentXP: 0,
          totalMaxXP: 0,
          xpToNextRank: 0,
          progressInCurrentRank: 0,
          globalProgress: 0,
        };
      }

      // Fetch user's ranks
      const { data: ranksData, error } = await supabase
        .from("ranks")
        .select("*")
        .eq("user_id", userId)
        .order("min_points", { ascending: true });

      if (error) throw error;

      const ranks: Rank[] = ranksData || [];

      // Calculate current XP from completed goals
      let currentXP = 0;
      let totalMaxXP = 0;

      if (goals) {
        for (const goal of goals) {
          const difficultyXP = DIFFICULTY_XP[goal.difficulty] || 100;
          const goalMaxXP = difficultyXP + (goal.potential_score || 0);
          
          totalMaxXP += goalMaxXP;

          // XP earned based on completion status
          if (goal.status === "fully_completed" || goal.status === "validated") {
            currentXP += goalMaxXP;
          } else if (goal.status === "in_progress") {
            // Partial XP based on step completion
            const totalSteps = goal.totalStepsCount || goal.total_steps || 1;
            const completedSteps = goal.completedStepsCount || goal.validated_steps || 0;
            const stepProgress = totalSteps > 0 ? completedSteps / totalSteps : 0;
            currentXP += Math.floor(goalMaxXP * stepProgress * 0.5); // 50% of potential until completion
          }
        }
      }

      // Clamp XP to max
      currentXP = Math.min(currentXP, totalMaxXP);

      // Find current and next rank
      let currentRank: Rank | null = null;
      let nextRank: Rank | null = null;

      for (let i = 0; i < ranks.length; i++) {
        if (currentXP >= ranks[i].min_points) {
          currentRank = ranks[i];
          nextRank = ranks[i + 1] || null;
        } else {
          break;
        }
      }

      // If no ranks defined, use a default structure
      if (!currentRank && ranks.length === 0) {
        currentRank = {
          id: "default",
          min_points: 0,
          name: "Initiate",
          frame_color: "#5bb4ff",
          glow_color: "rgba(91,180,255,0.5)",
        };
      }

      // Calculate progress
      const currentRankMin = currentRank?.min_points || 0;
      const nextRankMin = nextRank?.min_points || totalMaxXP || currentRankMin + 1000;
      const xpInRank = Math.max(0, currentXP - currentRankMin);
      const xpNeeded = nextRankMin - currentRankMin;
      const progressInCurrentRank = xpNeeded > 0 ? Math.min(100, (xpInRank / xpNeeded) * 100) : 100;
      const xpToNextRank = Math.max(0, nextRankMin - currentXP);
      const globalProgress = totalMaxXP > 0 ? Math.min(100, (currentXP / totalMaxXP) * 100) : 0;

      return {
        ranks,
        currentRank,
        nextRank,
        currentXP,
        totalMaxXP,
        xpToNextRank,
        progressInCurrentRank,
        globalProgress,
      };
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}