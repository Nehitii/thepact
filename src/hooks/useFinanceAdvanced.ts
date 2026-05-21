import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { createTableCrudHooks } from "./utils/createTableCrudHooks";

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
export const {
  useList: useSinkingFunds,
  useUpsert: useUpsertSinkingFund,
  useDelete: useDeleteSinkingFund,
} = createTableCrudHooks<SinkingFund>("sinking_funds", {
  queryKey: "sinking-funds",
  orderBy: { column: "created_at", ascending: false },
  successMessages: { upsert: "Fonds sauvegardé" },
});

export function useApplySinkingContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { fundId: string; amount: number; note?: string }) => {
      const { data, error } = await supabase.rpc("apply_sinking_contribution", {
        _fund_id: args.fundId,
        _amount: args.amount,
        _note: args.note ?? null,
        _source: "manual",
      });
      if (error) throw error;
      if (data && (data as any).success === false) throw new Error((data as any).error || "Échec");
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
export const {
  useList: useDebts,
  useUpsert: useUpsertDebt,
  useDelete: useDeleteDebt,
} = createTableCrudHooks<Debt>("debts", {
  queryKey: "debts",
  orderBy: { column: "created_at", ascending: false },
  successMessages: { upsert: "Dette sauvegardée" },
});

export function useDebtSchedule(debtId: string | null) {
  return useQuery({
    queryKey: ["debt-schedule", debtId],
    queryFn: async () => {
      if (!debtId) return [] as DebtScheduleRow[];
      const { data, error } = await supabase.rpc("compute_debt_schedule", { _debt_id: debtId });
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
      const { data, error } = await supabase.rpc("compute_cashflow_projection", { _months: months });
      if (error) throw error;
      return (data ?? []) as CashflowMonth[];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}

// ---------- Categorization rules ----------
export const {
  useList: useCategorizationRules,
  useUpsert: useUpsertCategorizationRule,
  useDelete: useDeleteCategorizationRule,
} = createTableCrudHooks<CategorizationRule>("categorization_rules", {
  queryKey: "categorization-rules",
  orderBy: { column: "priority", ascending: true },
});

export function useApplyCategorizationRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (limit?: number) => {
      const { data, error } = await supabase.rpc("apply_categorization_rules", { _limit: limit ?? 500 });
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
