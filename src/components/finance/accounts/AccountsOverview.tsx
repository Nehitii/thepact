import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { useAccounts, useAddAccount, useUpdateAccount, useDeleteAccount, useAccountTransfers, useExecuteTransfer } from '@/hooks/useAccounts';
import { AccountCard } from './AccountCard';
import { AddAccountModal } from './AddAccountModal';
import { TransferSimulator } from './TransferSimulator';
import type { UserAccount } from '@/types/finance';

interface AccountsOverviewProps {
  onSelectAccount?: (account: UserAccount) => void;
}

export function AccountsOverview({ onSelectAccount }: AccountsOverviewProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: accounts = [], isLoading } = useAccounts(user?.id);
  const { data: transfers = [] } = useAccountTransfers(user?.id);
  const addAccount = useAddAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const executeTransfer = useExecuteTransfer();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);

  const totalNetWorth = accounts.filter(a => a.is_active).reduce((sum, a) => sum + a.balance, 0);

  const handleSave = async (data: {
    name: string;
    bank_name?: string;
    account_type?: string;
    balance?: number;
    icon_emoji?: string;
    color?: string;
  }) => {
    try {
      if (editingAccount) {
        await updateAccount.mutateAsync({ id: editingAccount.id, ...data });
        toast.success(t('finance.accounts.updated'));
      } else {
        await addAccount.mutateAsync(data);
        toast.success(t('finance.accounts.added'));
      }
      setEditingAccount(null);
    } catch {
      toast.error(t('finance.accounts.saveFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount.mutateAsync(id);
      toast.success(t('finance.accounts.deleted'));
    } catch {
      toast.error(t('finance.accounts.deleteFailed'));
    }
  };

  const handleTransfer = async (params: { from_account_id: string; to_account_id: string; amount: number; note?: string }) => {
    try {
      await executeTransfer.mutateAsync(params);
      toast.success(t('finance.transfers.success'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transfer failed';
      toast.error(message);
    }
  };

  const handleEdit = (account: UserAccount) => {
    setEditingAccount(account);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Net Worth Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neu-card p-6 text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-[0_0_30px_hsla(200,100%,60%,0.15)]">
          <Wallet className="w-8 h-8 text-primary" />
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
          {t('finance.accounts.netWorth')}
        </p>
        <p className={`text-4xl font-bold tabular-nums ${totalNetWorth >= 0 ? 'text-foreground' : 'text-rose-400'}`}>
          {formatCurrency(totalNetWorth, currency)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {t('finance.accounts.accountsCount', { count: accounts.filter(a => a.is_active).length })}
        </p>
      </motion.div>

      {/* Account Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{t('finance.accounts.myAccounts')}</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setEditingAccount(null); setModalOpen(true); }}
            className="rounded-xl border-border"
          >
            <Plus className="w-4 h-4 mr-1" />{t('finance.accounts.addAccount')}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="neu-card p-5 h-32 animate-pulse" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neu-card p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl neu-inset flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">{t('finance.accounts.empty')}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{t('finance.accounts.emptyHint')}</p>
            <Button
              size="sm"
              className="mt-4 rounded-xl"
              onClick={() => { setEditingAccount(null); setModalOpen(true); }}
            >
              <Plus className="w-4 h-4 mr-1" />{t('finance.accounts.addFirst')}
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account, i) => (
              <motion.div key={account.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <AccountCard
                  account={account}
                  currency={currency}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Transfer Simulator */}
      {accounts.filter(a => a.is_active).length >= 2 && (
        <TransferSimulator
          accounts={accounts}
          transfers={transfers}
          currency={currency}
          onTransfer={handleTransfer}
          isPending={executeTransfer.isPending}
        />
      )}

      <AddAccountModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAccount(null); }}
        onSave={handleSave}
        editingAccount={editingAccount}
        currency={currency}
        isPending={addAccount.isPending || updateAccount.isPending}
      />
    </div>
  );
}
