import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { RecurringExpense, RecurringIncome, MonthlyValidation, FinanceSettings } from '@/types/finance';
import { createTableCrudHooks } from './utils/createTableCrudHooks';

export type { RecurringExpense, RecurringIncome, MonthlyValidation, FinanceSettings };

// Recurring Expenses — CRUD via generic factory.
// `useAdd`/`useUpdate` both alias to the same upsert (Supabase upsert inserts
// when no id is provided, updates when it is).
const expensesCrud = createTableCrudHooks<RecurringExpense>('recurring_expenses', {
  queryKey: 'recurring-expenses',
  orderBy: { column: 'created_at', ascending: true },
});
// Preserve legacy signature: `useRecurringExpenses(userId?)` — userId is now
// derived from the auth context but the argument is kept for API stability.
export const useRecurringExpenses = (_userId?: string) => expensesCrud.useList();
export const useAddRecurringExpense = expensesCrud.useUpsert;
export const useUpdateRecurringExpense = expensesCrud.useUpsert;
export const useDeleteRecurringExpense = expensesCrud.useDelete;

// Recurring Income — same pattern.
const incomeCrud = createTableCrudHooks<RecurringIncome>('recurring_income', {
  queryKey: 'recurring-income',
  orderBy: { column: 'created_at', ascending: true },
});
export const useRecurringIncome = (_userId?: string) => incomeCrud.useList();
export const useAddRecurringIncome = incomeCrud.useUpsert;
export const useUpdateRecurringIncome = incomeCrud.useUpsert;
export const useDeleteRecurringIncome = incomeCrud.useDelete;

// Monthly Validations hooks
export function useMonthlyValidations(userId?: string) {
  return useQuery({
    queryKey: ['monthly-validations', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('monthly_finance_validations')
        .select('*')
        .eq('user_id', userId)
        .order('month', { ascending: false });
      if (error) throw error;
      return data as MonthlyValidation[];
    },
    enabled: !!userId,
  });
}

export function useMonthlyValidation(userId?: string, month?: string) {
  return useQuery({
    queryKey: ['monthly-validation', userId, month],
    queryFn: async () => {
      if (!userId || !month) return null;
      const { data, error } = await supabase
        .from('monthly_finance_validations')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .maybeSingle();
      if (error) throw error;
      return data as MonthlyValidation | null;
    },
    enabled: !!userId && !!month,
  });
}

export function useUpsertMonthlyValidation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (validation: Partial<MonthlyValidation> & { month: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('monthly_finance_validations')
        .upsert(
          { ...validation, user_id: user.id },
          { onConflict: 'user_id,month' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-validations'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-validation'] });
    },
  });
}

// Finance Settings hooks
export async function fetchFinanceSettings(userId?: string): Promise<FinanceSettings | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('salary_payment_day, project_funding_target, project_monthly_allocation, already_funded, finance_default_account_id, finance_csv_date_format, finance_csv_delimiter, finance_budget_alert_pct')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return {
    salary_payment_day: data.salary_payment_day ?? 1,
    project_funding_target: data.project_funding_target ?? 0,
    project_monthly_allocation: data.project_monthly_allocation ?? 0,
    already_funded: data.already_funded ?? 0,
    finance_default_account_id: data.finance_default_account_id ?? null,
    finance_csv_date_format: data.finance_csv_date_format ?? 'YYYY-MM-DD',
    finance_csv_delimiter: data.finance_csv_delimiter ?? ',',
    finance_budget_alert_pct: data.finance_budget_alert_pct ?? 80,
  } as FinanceSettings;
}

export function useFinanceSettings(userId?: string) {
  return useQuery({
    queryKey: ['finance-settings', userId],
    queryFn: () => fetchFinanceSettings(userId),
    enabled: !!userId,
  });
}

export function useUpdateFinanceSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<FinanceSettings>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update(settings)
        .eq('id', user.id)
        .select('salary_payment_day, project_funding_target, project_monthly_allocation, already_funded, finance_default_account_id, finance_csv_date_format, finance_csv_delimiter, finance_budget_alert_pct')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-settings'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}