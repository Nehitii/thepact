import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { RecurringExpense, RecurringIncome, MonthlyValidation, FinanceSettings } from '@/domaines/finance/types';
import { createTableCrudHooks } from '@/hooks/utils/createTableCrudHooks';
import { trackTransactionLogged, trackFinanceMonthValidated } from '@/lib/achievements';

export type { RecurringExpense, RecurringIncome, MonthlyValidation, FinanceSettings };

// Recurring Expenses — CRUD via generic factory.
// `useAdd`/`useUpdate` both alias to the same upsert (Supabase upsert inserts
// when no id is provided, updates when it is).
const expensesCrud = createTableCrudHooks<RecurringExpense>('recurring_expenses', {
  queryKey: 'recurring-expenses',
  orderBy: { column: 'created_at', ascending: true },
  /* Poser une dépense récurrente EST une transaction consignée, du point
     de vue des succès : c'est ce geste-là que compte le compteur
     `transactions_logged`. Il n'y a plus de table de mouvements
     bancaires depuis le 20/08 — les flux récurrents sont ce qui reste. */
  apresEcriture: (userId) => trackTransactionLogged(userId),
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
  apresEcriture: (userId) => trackTransactionLogged(userId),
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
      if (user?.id) trackFinanceMonthValidated(user.id);
    },
  });
}

/* LES REGLAGES DE FINANCE VIVENT DANS `profiles`.
 *
 * Il n y a pas de table `finance_settings`, et en chercher une fait
 * perdre du temps. Ces quatre colonnes sont posees sur le profil parce
 * qu elles decrivent la PERSONNE — le jour ou son salaire tombe, ce
 * qu elle met de cote — et non un mois donne. Les separer aurait cree
 * une table a une ligne par utilisateur, jointe partout pour rien.
 *
 * Le nom du hook dit ce qu il REND, pas ou il le prend : c est le bon
 * sens de la dependance. Ce commentaire existe pour que l ecart entre
 * les deux cesse de ressembler a un oubli.
 */
export async function fetchFinanceSettings(userId?: string): Promise<FinanceSettings | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('salary_payment_day, project_funding_target, project_monthly_allocation, already_funded')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return {
    salary_payment_day: data.salary_payment_day ?? 1,
    project_funding_target: data.project_funding_target ?? 0,
    project_monthly_allocation: data.project_monthly_allocation ?? 0,
    already_funded: data.already_funded ?? 0,
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
        .select('salary_payment_day, project_funding_target, project_monthly_allocation, already_funded')
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