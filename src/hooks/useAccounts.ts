import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UserAccount, AccountTransfer } from '@/types/finance';

export function useAccounts(userId?: string) {
  return useQuery({
    queryKey: ['user-accounts', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as UserAccount[];
    },
    enabled: !!userId,
  });
}

export function useAddAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (account: {
      name: string;
      bank_name?: string;
      account_type?: string;
      balance?: number;
      icon_emoji?: string;
      icon_url?: string;
      color?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('user_accounts')
        .insert({ ...account, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-accounts'] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-accounts'] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-accounts'] });
    },
  });
}

export function useAccountTransfers(userId?: string) {
  return useQuery({
    queryKey: ['account-transfers', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('account_transfers')
        .select('*')
        .eq('user_id', userId)
        .order('transfer_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as AccountTransfer[];
    },
    enabled: !!userId,
  });
}

export function useExecuteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      from_account_id: string;
      to_account_id: string;
      amount: number;
      note?: string;
    }) => {
      const { data, error } = await supabase.rpc('execute_account_transfer', {
        p_from_account_id: params.from_account_id,
        p_to_account_id: params.to_account_id,
        p_amount: params.amount,
        p_note: params.note ?? null,
      });
      if (error) throw error;
      const result = data as unknown as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Transfer failed');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account-transfers'] });
    },
  });
}
