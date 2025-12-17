import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Goal {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  status: string;
  validated_steps: number;
  total_steps: number;
  potential_score: number;
  estimated_cost: number;
  created_at: string;
  start_date?: string;
  completion_date?: string;
  image_url?: string;
  is_focus?: boolean;
  goal_type?: string;
  habit_duration_days?: number;
  habit_checks?: boolean[];
  // Step counts from batch query
  completedStepsCount?: number;
  totalStepsCount?: number;
}

export function useGoals(pactId: string | undefined, options?: { includeStepCounts?: boolean }) {
  return useQuery({
    queryKey: ["goals", pactId, options?.includeStepCounts],
    queryFn: async () => {
      if (!pactId) return [];

      // Fetch all goals for this pact
      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select("*")
        .eq("pact_id", pactId)
        .order("created_at", { ascending: false });

      if (goalsError) throw goalsError;
      if (!goalsData || goalsData.length === 0) return [];

      // If step counts not needed, return goals directly
      if (!options?.includeStepCounts) {
        return goalsData as Goal[];
      }

      // BATCH QUERY: Fetch ALL steps for all goals in ONE query
      const goalIds = goalsData.map((g) => g.id);
      const { data: allSteps, error: stepsError } = await supabase
        .from("steps")
        .select("goal_id, status")
        .in("goal_id", goalIds);

      if (stepsError) throw stepsError;

      // Aggregate step counts client-side
      const stepCountsByGoal = new Map<string, { total: number; completed: number }>();
      
      for (const step of allSteps || []) {
        const existing = stepCountsByGoal.get(step.goal_id) || { total: 0, completed: 0 };
        existing.total++;
        if (step.status === "completed") {
          existing.completed++;
        }
        stepCountsByGoal.set(step.goal_id, existing);
      }

      // Merge step counts into goals
      const goalsWithCounts = goalsData.map((goal) => {
        const counts = stepCountsByGoal.get(goal.id) || { total: 0, completed: 0 };
        return {
          ...goal,
          totalStepsCount: counts.total,
          completedStepsCount: counts.completed,
        };
      });

      return goalsWithCounts as Goal[];
    },
    enabled: !!pactId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
