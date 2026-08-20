import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CostItem {
  id: string;
  goal_id: string;
  name: string;
  price: number;
  category: string | null;
  step_id: string | null;
  /** Nul tant que la piece n est pas achetee. */
  acquired_at: string | null;
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
      items: { name: string; price: number; id?: string; category?: string; stepId?: string | null }[];
    }) => {
      // Delete all existing items for this goal
      await supabase.from("goal_cost_items").delete().eq("goal_id", goalId);

      // Insert new items if any
      if (items.length > 0) {
        const insertData = items.map((item) => ({
          goal_id: goalId,
          name: item.name,
          price: item.price,
          category: item.category || null,
          step_id: item.stepId || null,
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

/* ── LES PIECES DU PACTE ────────────────────────────────────
 *
 * L onglet finance ne tient plus de comptes bancaires : il regarde le
 * pacte. Or ce qui coute, dans un pacte, ce sont les pieces chiffrees
 * accrochees aux objectifs. Les voici toutes ensemble, pour qu on
 * puisse arbitrer entre elles au lieu de les decouvrir une par une.
 */

/** Toutes les pieces des objectifs donnes, achetees ou non. */
export function usePactCostItems(goalIds: string[] | undefined) {
  const cle = (goalIds ?? []).slice().sort().join(",");
  return useQuery({
    queryKey: ["cost-items-pacte", cle],
    enabled: !!goalIds && goalIds.length > 0,
    queryFn: async () => {
      if (!goalIds || goalIds.length === 0) return [];
      const { data, error } = await supabase
        .from("goal_cost_items")
        .select("*")
        .in("goal_id", goalIds)
        .order("price", { ascending: true });
      if (error) throw error;
      return (data || []) as CostItem[];
    },
  });
}

/** Marquer des pieces comme acquises, ou revenir dessus. */
export function useAcquerirPieces() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, acquis }: { ids: string[]; acquis: boolean }) => {
      if (ids.length === 0) return 0;
      const { data, error } = await supabase
        .from("goal_cost_items")
        .update({ acquired_at: acquis ? new Date().toISOString() : null })
        .in("id", ids)
        .select("id");
      if (error) throw error;
      /* Une regle de securite qui bloque ne renvoie pas d erreur mais
         zero ligne : sans ce controle, l echec passait pour un succes. */
      if ((data?.length ?? 0) === 0) throw new Error("Aucune piece mise a jour");
      return data.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-items-pacte"] });
      queryClient.invalidateQueries({ queryKey: ["cost-items"] });
    },
  });
}
