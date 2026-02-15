/**
 * Goals data hook.
 *
 * Fetches goals with relational tags via a single Supabase query.
 * Step counts use a single batch query (not N+1).
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
  // Tags from relational select
  tags?: string[];
}

interface UseGoalsOptions {
  includeStepCounts?: boolean;
  includeTags?: boolean;
}

export function useGoals(pactId: string | undefined, options?: UseGoalsOptions) {
  const { includeStepCounts = false, includeTags = true } = options ?? {};

  return useQuery({
    queryKey: ["goals", pactId, includeStepCounts, includeTags],
    queryFn: async (): Promise<Goal[]> => {
      if (!pactId) return [];

      // Build select string — embed tags relationally when requested
      const selectParts = ["*"];
      if (includeTags) selectParts.push("goal_tags(tag)");

      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select(selectParts.join(", "))
        .eq("pact_id", pactId)
        .order("created_at", { ascending: false });

      if (goalsError) throw goalsError;
      if (!goalsData || goalsData.length === 0) return [];

      // Single batch query for step counts (not N+1)
      let stepCountsByGoal: Map<string, { total: number; completed: number }> | null = null;

      if (includeStepCounts) {
        const goalIds = goalsData.map((g: any) => g.id);
        const { data: stepsData, error: stepsError } = await supabase
          .from("steps")
          .select("goal_id, status")
          .in("goal_id", goalIds);

        if (stepsError) throw stepsError;

        stepCountsByGoal = new Map();
        if (stepsData) {
          for (const step of stepsData) {
            const existing = stepCountsByGoal.get(step.goal_id) || { total: 0, completed: 0 };
            existing.total++;
            if (step.status === "completed") existing.completed++;
            stepCountsByGoal.set(step.goal_id, existing);
          }
        }
      }

      // Map results — tags come from the relational join, no manual merge
      return goalsData.map((goal: any) => {
        const counts = stepCountsByGoal?.get(goal.id);
        const relationalTags: string[] | undefined =
          includeTags && Array.isArray(goal.goal_tags)
            ? goal.goal_tags.map((t: { tag: string }) => t.tag)
            : undefined;

        // Destructure goal_tags out so it doesn't leak into the Goal type
        const { goal_tags: _removed, ...goalFields } = goal;

        return {
          ...goalFields,
          totalStepsCount: counts?.total,
          completedStepsCount: counts?.completed,
          tags: relationalTags && relationalTags.length > 0 ? relationalTags : undefined,
        } as Goal;
      });
    },
    enabled: !!pactId,
    staleTime: 30_000,
  });
}
