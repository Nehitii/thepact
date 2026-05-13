import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ---------- Types ----------
export interface SinkingFund {
  id: string;
  user_id: string;
  name: string;
  icon_emoji: string | null;
  target_amount: number;
  target_date: string | null;
  monthly_contribution: number;
  current_balance: number;
  account_id: string | null;
  goal_id: string | null;
  is_active: boolean;
  auto_contribute: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  debt_type: "loan" | "mortgage" | "credit_card" | "personal" | "other" | string;
  principal: number;
  current_balance: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string;
  end_date: string | null;
  account_id: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategorizationRule {
  id: string;
  user_id: string;
  pattern: string;
  match_type: "contains" | "equals" | "prefix" | "regex" | string;
  category: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CashflowMonth {
  month_start: string;
  income: number;
  expenses: number;
  sinking: number;
  debt_payments: number;
  net: number;
  cumulative_realistic: number;
  cumulative_worst: number;
  cumulative_best: number;
}

export interface DebtScheduleRow {
  installment: number;
  due_date: string;
  payment: number;
  interest: number;
  principal_paid: number;
  remaining_balance: number;
}

// ---------- Sinking funds ----------
export function useSinkingFunds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sinking-funds", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as SinkingFund[];
      const { data, error } = await (supabase as any)
        .from("sinking_funds")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SinkingFund[];
    },
    enabled: !!user?.id,
  });
}

export function useUpsertSinkingFund() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: Partial<SinkingFund> & { name: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const row = { ...payload, user_id: user.id };
      const { data, error } = await (supabase as any).from("sinking_funds").upsert(row).select().single();
      if (error) throw error;
      return data as SinkingFund;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sinking-funds"] });
      toast.success("Fonds sauvegardé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSinkingFund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("sinking_funds").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sinking-funds"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useApplySinkingContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { fundId: string; amount: number; note?: string }) => {
      const { data, error } = await (supabase as any).rpc("apply_sinking_contribution", {
        _fund_id: args.fundId,
        _amount: args.amount,
        _note: args.note ?? null,
        _source: "manual",
      });
      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || "Échec");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sinking-funds"] });
      toast.success("Contribution enregistrée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---------- Debts ----------
export function useDebts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["debts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as Debt[];
      const { data, error } = await (supabase as any)
        .from("debts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Debt[];
    },
    enabled: !!user?.id,
  });
}

export function useUpsertDebt() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: Partial<Debt> & { name: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any).from("debts").upsert({ ...payload, user_id: user.id }).select().single();
      if (error) throw error;
      return data as Debt;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debts"] });
      toast.success("Dette sauvegardée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("debts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDebtSchedule(debtId: string | null) {
  return useQuery({
    queryKey: ["debt-schedule", debtId],
    queryFn: async () => {
      if (!debtId) return [] as DebtScheduleRow[];
      const { data, error } = await (supabase as any).rpc("compute_debt_schedule", { _debt_id: debtId });
      if (error) throw error;
      return (data ?? []) as DebtScheduleRow[];
    },
    enabled: !!debtId,
    staleTime: 60_000,
  });
}

// ---------- Cashflow projection ----------
export function useCashflowProjection(months = 6) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cashflow-projection", user?.id, months],
    queryFn: async () => {
      if (!user?.id) return [] as CashflowMonth[];
      const { data, error } = await (supabase as any).rpc("compute_cashflow_projection", { _months: months });
      if (error) throw error;
      return (data ?? []) as CashflowMonth[];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}

// ---------- Categorization rules ----------
export function useCategorizationRules() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["categorization-rules", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as CategorizationRule[];
      const { data, error } = await (supabase as any)
        .from("categorization_rules")
        .select("*")
        .eq("user_id", user.id)
        .order("priority", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CategorizationRule[];
    },
    enabled: !!user?.id,
  });
}

export function useUpsertCategorizationRule() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: Partial<CategorizationRule> & { pattern: string; category: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any).from("categorization_rules").upsert({ ...payload, user_id: user.id }).select().single();
      if (error) throw error;
      return data as CategorizationRule;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categorization-rules"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCategorizationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("categorization_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categorization-rules"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useApplyCategorizationRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (limit?: number) => {
      const { data, error } = await (supabase as any).rpc("apply_categorization_rules", { _limit: limit ?? 500 });
      if (error) throw error;
      return data as { success: boolean; updated: number };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(`${res?.updated ?? 0} transactions catégorisées`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
