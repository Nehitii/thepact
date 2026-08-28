import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Etapes d'un seul objectif, chargees a la demande.
 *
 * Le registre n'ouvre qu'une ligne a la fois : inutile de charger les
 * etapes des trente-huit objectifs pour n'en montrer que celles d'un
 * seul. La requete ne part que lorsqu'une ligne s'ouvre, et le resultat
 * reste en cache — rouvrir la meme ligne n'interroge plus la base.
 */
export interface Etape {
  id: string;
  title: string | null;
  status: string | null;
  order: number | null;
}

export function useGoalSteps(goalId: string | null) {
  return useQuery({
    queryKey: ["goal-steps", goalId],
    queryFn: async (): Promise<Etape[]> => {
      if (!goalId) return [];
      const { data, error } = await supabase
        .from("steps")
        .select("id, title, status, order")
        .eq("goal_id", goalId)
        .order("order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Etape[];
    },
    enabled: !!goalId,
    staleTime: 60_000,
  });
}
