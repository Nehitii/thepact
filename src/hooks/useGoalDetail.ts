/**
 * Goal detail data hook.
 * 
 * Fetches a single goal with its steps using React Query for caching.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface GoalDetailData {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  status: string;
  validated_steps: number;
  total_steps: number;
  estimated_cost: number;
  notes: string | null;
  potential_score: number;
  start_date?: string;
  completion_date?: string;
  image_url?: string;
  is_focus?: boolean;
  goal_type?: string;
  habit_duration_days?: number;
  habit_checks?: boolean[];
  child_goal_ids?: string[] | null;
  super_goal_rule?: any;
  is_dynamic_super?: boolean;
  pact_id?: string;
  created_at?: string;
}

export interface StepData {
  id: string;
  title: string;
  order: number;
  status: string;
  due_date: string | null;
  notes?: string | null;
  goal_id: string;
  description?: string | null;
  completion_date?: string | null;
  validated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function useGoalDetail(goalId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ["goal-detail", goalId],
    queryFn: async () => {
      if (!goalId) return null;

      const [goalResult, stepsResult] = await Promise.all([
        supabase.from("goals").select("*").eq("id", goalId).single(),
        supabase.from("steps").select("*").eq("goal_id", goalId).order("order", { ascending: true }),
      ]);

      if (goalResult.error) throw goalResult.error;

      return {
        goal: goalResult.data as GoalDetailData,
        steps: (stepsResult.data || []) as StepData[],
      };
    },
    enabled: !!goalId && !!userId,
    staleTime: 15 * 1000, // 15 seconds
  });
}
