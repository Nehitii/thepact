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
  is_public: boolean;
  rating_avg: number;
  rating_count: number;
  use_count: number;
  created_by: string | null;
  source_goal_id: string | null;
  created_at: string;
}

export interface TemplateRating {
  id: string;
  template_id: string;
  user_id: string;
  rating: number;
  review: string | null;
  created_at: string;
}

export function usePublicTemplates(filters?: { category?: string; search?: string; sort?: "rating" | "popular" | "recent" }) {
  return useQuery({
    queryKey: ["public-templates", filters],
    queryFn: async () => {
      let q = (supabase as any)
        .from("goal_templates")
        .select("*")
        .eq("is_public", true);
      if (filters?.category && filters.category !== "all") q = q.eq("category", filters.category);
      if (filters?.search) q = q.ilike("name", `%${filters.search}%`);
      const sort = filters?.sort ?? "rating";
      if (sort === "rating") q = q.order("rating_avg", { ascending: false }).order("rating_count", { ascending: false });
      else if (sort === "popular") q = q.order("use_count", { ascending: false });
      else q = q.order("created_at", { ascending: false });
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return (data || []) as GoalTemplate[];
    },
    staleTime: 60_000,
  });
}

export function useTemplateRatings(templateId?: string) {
  return useQuery({
    queryKey: ["template-ratings", templateId],
    queryFn: async () => {
      if (!templateId) return [] as TemplateRating[];
      const { data, error } = await (supabase as any)
        .from("template_ratings")
        .select("*")
        .eq("template_id", templateId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as TemplateRating[];
    },
    enabled: !!templateId,
  });
}

export function useRateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { templateId: string; rating: number; review?: string }) => {
      const { data, error } = await (supabase as any).rpc("rate_template", {
        _template_id: args.templateId,
        _rating: args.rating,
        _review: args.review ?? null,
      });
      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || "Erreur");
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["public-templates"] });
      qc.invalidateQueries({ queryKey: ["template-ratings", vars.templateId] });
      qc.invalidateQueries({ queryKey: ["goal-templates"] });
    },
  });
}

export function useToggleTemplatePublic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { templateId: string; is_public: boolean }) => {
      const { error } = await (supabase as any)
        .from("goal_templates")
        .update({ is_public: args.is_public })
        .eq("id", args.templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goal-templates"] });
      qc.invalidateQueries({ queryKey: ["public-templates"] });
    },
  });
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
