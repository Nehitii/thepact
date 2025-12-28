import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface CostItem {
  id: string;
  goal_id: string;
  name: string;
  price: number;
  created_at: string;
  updated_at: string;
}

export function useCostItems(goalId: string | undefined) {
  return useQuery({
    queryKey: ["cost-items", goalId],
    queryFn: async () => {
      if (!goalId) return [];
      
      const { data, error } = await supabase
        .from("goal_cost_items")
        .select("*")
        .eq("goal_id", goalId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as CostItem[];
    },
    enabled: !!goalId,
  });
}

export function useSaveCostItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      goalId,
      items,
    }: {
      goalId: string;
      items: { name: string; price: number; id?: string }[];
    }) => {
      // Delete all existing items for this goal
      await supabase.from("goal_cost_items").delete().eq("goal_id", goalId);

      // Insert new items if any
      if (items.length > 0) {
        const insertData = items.map((item) => ({
          goal_id: goalId,
          name: item.name,
          price: item.price,
        }));

        const { error } = await supabase.from("goal_cost_items").insert(insertData);
        if (error) throw error;
      }

      // Calculate total and update goal's estimated_cost
      const total = items.reduce((sum, item) => sum + item.price, 0);
      const { error: goalError } = await supabase
        .from("goals")
        .update({ estimated_cost: total })
        .eq("id", goalId);

      if (goalError) throw goalError;

      return total;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cost-items", variables.goalId] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
