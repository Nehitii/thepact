import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GoalContract {
  id: string;
  goal_id: string;
  owner_id: string;
  witnesses: string[];
  stake_bonds: number;
  deadline: string | null;
  status: "pending" | "active" | "succeeded" | "failed" | "canceled";
  signed_at: string | null;
  settled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useGoalContracts(goalId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["goal-contracts", goalId, user?.id],
    queryFn: async () => {
      const q = supabase.from("goal_contracts" as any).select("*").order("created_at", { ascending: false });
      const { data, error } = goalId ? await q.eq("goal_id", goalId) : await q;
      if (error) throw error;
      return (data ?? []) as unknown as GoalContract[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateGoalContract() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      goal_id: string;
      witnesses: string[];
      stake_bonds: number;
      deadline?: string | null;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error("Auth required");
      const { data, error } = await supabase
        .from("goal_contracts" as any)
        .insert({ ...input, owner_id: user.id, status: "active", signed_at: new Date().toISOString() } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Contrat signé");
      qc.invalidateQueries({ queryKey: ["goal-contracts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateContractStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: GoalContract["status"] }) => {
      const { error } = await supabase
        .from("goal_contracts" as any)
        .update({ status, settled_at: status === "succeeded" || status === "failed" ? new Date().toISOString() : null } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goal-contracts"] }),
  });
}