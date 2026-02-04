/**
 * Goals data hook.
 * 
 * Provides access to user goals with optional step counts and tags.
 * Uses React Query for caching and automatic refetching.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { SuperGoalRule } from "@/components/goals/super/types";

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
  // Super Goal fields
  child_goal_ids?: string[] | null;
  super_goal_rule?: SuperGoalRule | null;
  is_dynamic_super?: boolean;
  // Step counts from batch query
  completedStepsCount?: number;
  totalStepsCount?: number;
  // Tags from junction table
  tags?: string[];
}

export function useGoals(pactId: string | undefined, options?: { includeStepCounts?: boolean; includeTags?: boolean }) {
  return useQuery({
    queryKey: ["goals", pactId, options?.includeStepCounts, options?.includeTags],
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

      const goalIds = goalsData.map((g) => g.id);

      // Parallel fetch for step counts and tags
      const [stepsResult, tagsResult] = await Promise.all([
        // Fetch step counts if requested
        options?.includeStepCounts
          ? supabase.from("steps").select("goal_id, status").in("goal_id", goalIds)
          : Promise.resolve({ data: null, error: null }),
        // Fetch tags if requested (default: true for backwards compat)
        options?.includeTags !== false
          ? supabase.from("goal_tags").select("goal_id, tag").in("goal_id", goalIds)
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (stepsResult.error) throw stepsResult.error;
      if (tagsResult.error) throw tagsResult.error;

      // Aggregate step counts client-side
      const stepCountsByGoal = new Map<string, { total: number; completed: number }>();
      if (stepsResult.data) {
        for (const step of stepsResult.data) {
          const existing = stepCountsByGoal.get(step.goal_id) || { total: 0, completed: 0 };
          existing.total++;
          if (step.status === "completed") {
            existing.completed++;
          }
          stepCountsByGoal.set(step.goal_id, existing);
        }
      }

      // Aggregate tags by goal
      const tagsByGoal = new Map<string, string[]>();
      if (tagsResult.data) {
        for (const row of tagsResult.data) {
          const existing = tagsByGoal.get(row.goal_id) || [];
          existing.push(row.tag);
          tagsByGoal.set(row.goal_id, existing);
        }
      }

      // Merge step counts and tags into goals
      const goalsWithExtras = goalsData.map((goal) => {
        const counts = stepCountsByGoal.get(goal.id) || { total: 0, completed: 0 };
        const tags = tagsByGoal.get(goal.id) || [];
        return {
          ...goal,
          totalStepsCount: options?.includeStepCounts ? counts.total : undefined,
          completedStepsCount: options?.includeStepCounts ? counts.completed : undefined,
          tags: tags.length > 0 ? tags : undefined,
        };
      });

      return goalsWithExtras as Goal[];
    },
    enabled: !!pactId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
