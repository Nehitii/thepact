import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { roundMoney } from '@/lib/financeCategories';

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
}

export function useTransactions(userId: string | undefined, filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['bank_transactions', userId, filters?.dateFrom, filters?.dateTo],
    queryFn: async () => {
      if (!userId) return [];
      let query = supabase
        .from('bank_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });

      if (filters?.dateFrom) {
        query = query.gte('transaction_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('transaction_date', filters.dateTo);
      }

      if (!filters?.dateFrom && !filters?.dateTo) {
        query = query.limit(500);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: {
      description: string;
      amount: number;
      transaction_type: string;
      transaction_date: string;
      category?: string;
      note?: string;
      account_id?: string;
      source?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('bank_transactions').insert({
        ...tx,
        amount: roundMoney(tx.amount),
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank_transactions'] });
      qc.invalidateQueries({ queryKey: ['user-accounts'] });
      qc.invalidateQueries({ queryKey: ['account-balances'] });
    },
  });
}

export function useAddTransactionsBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (txs: Array<{
      description: string;
      amount: number;
      transaction_type: string;
      transaction_date: string;
      category?: string;
      note?: string;
      account_id?: string;
      source?: string;
    }>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const rows = txs.map(tx => ({ ...tx, amount: roundMoney(tx.amount), user_id: user.id }));
      const { error } = await supabase.from('bank_transactions').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank_transactions'] });
      qc.invalidateQueries({ queryKey: ['user-accounts'] });
      qc.invalidateQueries({ queryKey: ['account-balances'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bank_transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank_transactions'] });
      qc.invalidateQueries({ queryKey: ['user-accounts'] });
      qc.invalidateQueries({ queryKey: ['account-balances'] });
    },
  });
}

export function useDeleteTransactionsBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('bank_transactions').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank_transactions'] });
      qc.invalidateQueries({ queryKey: ['user-accounts'] });
      qc.invalidateQueries({ queryKey: ['account-balances'] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; description?: string; amount?: number; transaction_type?: string; transaction_date?: string; category?: string; note?: string; account_id?: string }) => {
      const { id, ...updates } = params;
      if (updates.amount !== undefined) updates.amount = roundMoney(updates.amount);
      const { error } = await supabase.from('bank_transactions').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank_transactions'] });
      qc.invalidateQueries({ queryKey: ['user-accounts'] });
      qc.invalidateQueries({ queryKey: ['account-balances'] });
    },
  });
}
