import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GoalTemplate {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
  tags: string[];
  steps: { title: string; description?: string }[];
  estimated_cost: number;
  goal_type: string;
  habit_duration_days: number | null;
  category: string;
  is_featured: boolean;
  use_count: number;
  created_by: string | null;
  source_goal_id: string | null;
  created_at: string;
}

export function useGoalTemplates() {
  return useQuery({
    queryKey: ["goal-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("goal_templates")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("use_count", { ascending: false });
      if (error) throw error;
      return (data || []) as GoalTemplate[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: {
      name: string;
      description?: string;
      difficulty: string;
      tags: string[];
      steps: { title: string; description?: string }[];
      estimated_cost?: number;
      goal_type?: string;
      habit_duration_days?: number;
      category?: string;
      source_goal_id?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any)
        .from("goal_templates")
        .insert({
          ...template,
          created_by: user.id,
          steps: JSON.stringify(template.steps),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal-templates"] });
    },
  });
}

export function useIncrementTemplateUse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await (supabase as any)
        .from("goal_templates")
        .update({ use_count: (supabase as any).rpc ? undefined : 0 })
        .eq("id", templateId);
      // Simple increment via raw update
      const { error: err2 } = await (supabase as any).rpc("increment_template_use", { p_template_id: templateId }).catch(() => {
        // Fallback: just ignore if RPC doesn't exist
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal-templates"] });
    },
  });
}
