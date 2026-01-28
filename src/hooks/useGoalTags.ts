import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface GoalTag {
  id: string;
  goal_id: string;
  tag: string;
  created_at: string;
}

// Fetch tags for a single goal
export function useGoalTags(goalId: string | undefined) {
  return useQuery({
    queryKey: ["goal-tags", goalId],
    queryFn: async () => {
      if (!goalId) return [];
      const { data, error } = await supabase
        .from("goal_tags")
        .select("*")
        .eq("goal_id", goalId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as GoalTag[];
    },
    enabled: !!goalId,
    staleTime: 30 * 1000,
  });
}

// Fetch tags for multiple goals (batch query)
export function useGoalTagsBatch(goalIds: string[]) {
  return useQuery({
    queryKey: ["goal-tags-batch", goalIds.sort().join(",")],
    queryFn: async () => {
      if (goalIds.length === 0) return new Map<string, string[]>();
      
      const { data, error } = await supabase
        .from("goal_tags")
        .select("goal_id, tag")
        .in("goal_id", goalIds);
      
      if (error) throw error;
      
      // Group tags by goal_id
      const tagsByGoal = new Map<string, string[]>();
      for (const row of data || []) {
        const existing = tagsByGoal.get(row.goal_id) || [];
        existing.push(row.tag);
        tagsByGoal.set(row.goal_id, existing);
      }
      
      return tagsByGoal;
    },
    enabled: goalIds.length > 0,
    staleTime: 30 * 1000,
  });
}

// Save tags for a goal (replaces all existing tags)
export function useSaveGoalTags() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ goalId, tags }: { goalId: string; tags: string[] }) => {
      // Delete existing tags
      const { error: deleteError } = await supabase
        .from("goal_tags")
        .delete()
        .eq("goal_id", goalId);
      
      if (deleteError) throw deleteError;
      
      // Insert new tags
      if (tags.length > 0) {
        const tagRecords = tags.map((tag) => ({
          goal_id: goalId,
          tag,
        }));
        
        const { error: insertError } = await supabase
          .from("goal_tags")
          .insert(tagRecords);
        
        if (insertError) throw insertError;
      }
      
      return tags;
    },
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: ["goal-tags", goalId] });
      queryClient.invalidateQueries({ queryKey: ["goal-tags-batch"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

// Insert tags for a newly created goal
export async function insertGoalTags(goalId: string, tags: string[]) {
  if (tags.length === 0) return;
  
  const tagRecords = tags.map((tag) => ({
    goal_id: goalId,
    tag,
  }));
  
  const { error } = await supabase
    .from("goal_tags")
    .insert(tagRecords);
  
  if (error) throw error;
}
