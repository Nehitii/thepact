import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { roundMoney } from '@/lib/financeCategories';
import type { UserAccount } from '@/types/finance';

interface ComputedBalance {
  accountId: string;
  computedBalance: number;
  txCount: number;
}

export function useAccountBalances(accounts: UserAccount[], userId?: string) {
  const accountIds = accounts.map(a => a.id);

  return useQuery({
    queryKey: ['account-balances', userId, accountIds.join(',')],
    queryFn: async () => {
      if (!userId || accounts.length === 0) return new Map<string, ComputedBalance>();

      // Filter server-side by account_id instead of fetching all transactions
      const { data: txs, error } = await supabase
        .from('bank_transactions')
        .select('account_id, amount, transaction_type, transaction_date')
        .eq('user_id', userId)
        .in('account_id', accountIds);

      if (error) throw error;

      const result = new Map<string, ComputedBalance>();

      for (const account of accounts) {
        const balanceDate = account.balance_date || account.created_at.split('T')[0];
        const initial = account.initial_balance ?? account.balance ?? 0;

        const accountTxs = (txs ?? []).filter(
          tx => tx.account_id === account.id && tx.transaction_date >= balanceDate
        );

        let delta = 0;
        for (const tx of accountTxs) {
          if (tx.transaction_type === 'credit') {
            delta += Number(tx.amount);
          } else {
            delta -= Number(tx.amount);
          }
        }

        result.set(account.id, {
          accountId: account.id,
          computedBalance: roundMoney(initial + delta),
          txCount: accountTxs.length,
        });
      }

      return result;
    },
    enabled: !!userId && accounts.length > 0,
  });
}
