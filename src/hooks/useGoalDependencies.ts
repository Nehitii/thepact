import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GoalDependency {
  id: string;
  user_id: string;
  goal_id: string;
  depends_on_goal_id: string;
  kind: "blocks" | "related";
  notes: string | null;
  created_at: string;
}

export interface GoalDependencyWithName extends GoalDependency {
  depends_on_name?: string | null;
  depends_on_status?: string | null;
}

export function useGoalDependencies(goalId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["goal-dependencies", goalId, user?.id],
    queryFn: async () => {
      if (!goalId) return { outgoing: [] as GoalDependencyWithName[], incoming: [] as GoalDependencyWithName[] };
      // Outgoing (this goal depends on others)
      const { data: out, error: e1 } = await supabase
        .from("goal_dependencies" as any)
        .select("*")
        .eq("goal_id", goalId);
      if (e1) throw e1;
      // Incoming (others depend on this goal)
      const { data: incoming, error: e2 } = await supabase
        .from("goal_dependencies" as any)
        .select("*")
        .eq("depends_on_goal_id", goalId);
      if (e2) throw e2;

      const all = [...(out ?? []), ...(incoming ?? [])] as unknown as GoalDependency[];
      const ids = Array.from(new Set(all.flatMap(d => [d.goal_id, d.depends_on_goal_id])));
      let goals: Array<{ id: string; name: string; status: string }> = [];
      if (ids.length) {
        const { data } = await supabase.from("goals").select("id,name,status").in("id", ids);
        goals = (data ?? []) as any;
      }
      const map = new Map(goals.map((g) => [g.id, g]));
      return {
        outgoing: ((out ?? []) as unknown as GoalDependency[]).map(d => ({
          ...d,
          depends_on_name: map.get(d.depends_on_goal_id)?.name ?? null,
          depends_on_status: map.get(d.depends_on_goal_id)?.status ?? null,
        })) as GoalDependencyWithName[],
        incoming: ((incoming ?? []) as unknown as GoalDependency[]).map(d => ({
          ...d,
          depends_on_name: map.get(d.goal_id)?.name ?? null,
          depends_on_status: map.get(d.goal_id)?.status ?? null,
        })) as GoalDependencyWithName[],
      };
    },
    enabled: !!user?.id && !!goalId,
  });
}

export function useCreateGoalDependency() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      goal_id: string;
      depends_on_goal_id: string;
      kind?: "blocks" | "related";
      notes?: string;
    }) => {
      if (!user?.id) throw new Error("Auth required");
      const { error } = await supabase
        .from("goal_dependencies" as any)
        .insert({ ...input, user_id: user.id, kind: input.kind ?? "blocks" } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dépendance ajoutée");
      qc.invalidateQueries({ queryKey: ["goal-dependencies"] });
    },
    onError: (e: Error) => toast.error(e.message.includes("Cycle") ? "Cycle détecté — relation refusée" : e.message),
  });
}

export function useDeleteGoalDependency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goal_dependencies" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dépendance retirée");
      qc.invalidateQueries({ queryKey: ["goal-dependencies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
