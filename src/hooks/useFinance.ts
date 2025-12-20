import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RecurringExpense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringIncome {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonthlyValidation {
  id: string;
  user_id: string;
  month: string;
  confirmed_expenses: boolean;
  confirmed_income: boolean;
  unplanned_expenses: number;
  unplanned_income: number;
  actual_total_income: number;
  actual_total_expenses: number;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceSettings {
  salary_payment_day: number;
  project_funding_target: number;
  project_monthly_allocation: number;
}

// Recurring Expenses hooks
export function useRecurringExpenses(userId?: string) {
  return useQuery({
    queryKey: ['recurring-expenses', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as RecurringExpense[];
    },
    enabled: !!userId,
  });
}

export function useAddRecurringExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (expense: { name: string; amount: number }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert({ ...expense, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
  });
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; amount?: number; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
  });
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
  });
}

// Recurring Income hooks
export function useRecurringIncome(userId?: string) {
  return useQuery({
    queryKey: ['recurring-income', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('recurring_income')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as RecurringIncome[];
    },
    enabled: !!userId,
  });
}

export function useAddRecurringIncome() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (income: { name: string; amount: number }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('recurring_income')
        .insert({ ...income, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-income'] });
    },
  });
}

export function useUpdateRecurringIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; amount?: number; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('recurring_income')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-income'] });
    },
  });
}

export function useDeleteRecurringIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_income')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-income'] });
    },
  });
}

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
export function useFinanceSettings(userId?: string) {
  return useQuery({
    queryKey: ['finance-settings', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('salary_payment_day, project_funding_target, project_monthly_allocation')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data as FinanceSettings;
    },
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
        .select('salary_payment_day, project_funding_target, project_monthly_allocation')
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
