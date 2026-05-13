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
        .insert({
          ...input,
          owner_id: user.id,
          // pending until all witnesses sign; cascade trigger notifies witnesses
          status: input.witnesses && input.witnesses.length > 0 ? "pending" : "active",
          signed_at: input.witnesses && input.witnesses.length > 0 ? null : new Date().toISOString(),
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Contrat envoyé aux témoins");
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

export function useSignGoalContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { contractId: string; signatureName: string }) => {
      const { data, error } = await (supabase as any).rpc("sign_goal_contract", {
        _contract_id: args.contractId,
        _signature_name: args.signatureName,
      });
      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || "Erreur de signature");
      return data as { success: true; signed: number; required: number; activated: boolean };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["goal-contracts"] });
      qc.invalidateQueries({ queryKey: ["contract-signatures"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(res?.activated ? "Pacte activé" : `Signature enregistrée (${res?.signed}/${res?.required})`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface ContractSignature {
  id: string;
  contract_id: string;
  witness_id: string;
  signature_name: string;
  signed_at: string;
}

export function useContractSignatures(contractId?: string) {
  return useQuery({
    queryKey: ["contract-signatures", contractId],
    queryFn: async () => {
      if (!contractId) return [] as ContractSignature[];
      const { data, error } = await (supabase as any)
        .from("contract_signatures")
        .select("*")
        .eq("contract_id", contractId)
        .order("signed_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ContractSignature[];
    },
    enabled: !!contractId,
  });
}

export function useGoalContractById(contractId?: string) {
  return useQuery({
    queryKey: ["goal-contract", contractId],
    queryFn: async () => {
      if (!contractId) return null;
      const { data, error } = await supabase
        .from("goal_contracts" as any)
        .select("*")
        .eq("id", contractId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as GoalContract | null;
    },
    enabled: !!contractId,
  });
}