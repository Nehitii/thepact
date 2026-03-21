import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTransactions(userId: string | undefined) {
  return useQuery({
    queryKey: ['bank_transactions', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false })
        .limit(500);
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
      const { error } = await supabase.from('bank_transactions').insert({ ...tx, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank_transactions'] }),
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
      const rows = txs.map(tx => ({ ...tx, user_id: user.id }));
      const { error } = await supabase.from('bank_transactions').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank_transactions'] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bank_transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank_transactions'] }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; description?: string; amount?: number; transaction_type?: string; transaction_date?: string; category?: string; note?: string; account_id?: string }) => {
      const { id, ...updates } = params;
      const { error } = await supabase.from('bank_transactions').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank_transactions'] }),
  });
}
