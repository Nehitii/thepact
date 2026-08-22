/**
 * Goal detail data hook.
 * 
 * Fetches a single goal with its steps using React Query for caching.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GoalDetailData {
  id: string;
  name: string;
  type: string | null;
  difficulty: string | null;
  status: string | null;
  validated_steps: number | null;
  total_steps: number | null;
  estimated_cost: number | null;
  notes: string | null;
  potential_score: number | null;
  start_date?: string | null;
  completion_date?: string | null;
  image_url?: string | null;
  is_focus?: boolean | null;
  goal_type?: string;
  habit_duration_days?: number | null;
  habit_checks?: boolean[] | null;
  child_goal_ids?: string[] | null;
  super_goal_rule?: any | null;
  is_dynamic_super?: boolean | null;
  pact_id?: string;
  created_at?: string | null;
  deadline?: string | null;
  is_locked?: boolean;
}

export interface StepData {
  id: string;
  title: string;
  order: number;
  status: string | null;
  due_date: string | null;
  notes?: string | null;
  goal_id: string;
  description?: string | null;
  completion_date?: string | null;
  validated_at?: string | null;
  /* L etape ultime : exclue de l avancement, une seule par objectif,
     elle ouvre le zenith une fois franchie. */
  is_ultimate?: boolean;
  /* Exclue du tirage au sort. Elle manquait a cette interface alors que
     le select est une etoile : la page la lisait donc a travers un
     « as any » sur une donnee pourtant bien chargee. */
  exclude_from_spin?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
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
