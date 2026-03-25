import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Upload, Trash2, Edit2, Copy, ArrowUpCircle, ArrowDownCircle, Search, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { useTransactions, useDeleteTransaction, useAddTransaction } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useAccountBalances } from '@/hooks/useAccountBalances';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { AddTransactionModal } from './AddTransactionModal';
import { CsvImportModal } from './CsvImportModal';

interface TransactionsTabProps {
  accountFilter?: string | null;
  onClearAccountFilter?: () => void;
  financeSettings?: {
    finance_csv_date_format?: string;
    finance_csv_delimiter?: string;
  };
}

const PAGE_SIZE = 50;

export function TransactionsTab({ accountFilter, onClearAccountFilter, financeSettings }: TransactionsTabProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: transactions = [], isLoading } = useTransactions(user?.id);
  const { data: accounts = [] } = useAccounts(user?.id);
  const { data: balancesMap } = useAccountBalances(accounts, user?.id);
  const deleteTx = useDeleteTransaction();
  const duplicateTx = useAddTransaction();

  const [addOpen, setAddOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [editingTx, setEditingTx] = useState<any>(null);

  // Sync external account filter
  useEffect(() => {
    if (accountFilter) {
      setSelectedAccountId(accountFilter);
    }
  }, [accountFilter]);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (typeFilter !== 'all' && tx.transaction_type !== typeFilter) return false;
      if (selectedAccountId !== 'all' && tx.account_id !== selectedAccountId) return false;
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, search, typeFilter, selectedAccountId]);

  const showRunningBalance = selectedAccountId !== 'all';

  // Compute running balance when filtering by account
  const runningBalances = useMemo(() => {
    if (!showRunningBalance) return new Map<string, number>();
    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) return new Map<string, number>();

    const initial = account.initial_balance ?? account.balance ?? 0;
    const balanceDate = account.balance_date || account.created_at?.split('T')[0] || '1970-01-01';

    // Sort ascending by date for cumulative calc
    const sorted = [...filtered].sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));
    const map = new Map<string, number>();
    let running = initial;

    for (const tx of sorted) {
      if (tx.transaction_date >= balanceDate) {
        if (tx.transaction_type === 'credit') running += tx.amount;
        else running -= tx.amount;
      }
      map.set(tx.id, running);
    }
    return map;
  }, [filtered, showRunningBalance, selectedAccountId, accounts]);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const handleDelete = async (id: string) => {
    try {
      await deleteTx.mutateAsync(id);
      toast.success(t('finance.transactions.deleted'));
    } catch {
      toast.error(t('finance.transactions.deleteFailed'));
    }
  };

  const handleDuplicate = async (tx: any) => {
    try {
      await duplicateTx.mutateAsync({
        description: tx.description,
        amount: tx.amount,
        transaction_type: tx.transaction_type,
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        category: tx.category || undefined,
        account_id: tx.account_id || undefined,
        source: 'manual',
      });
      toast.success(t('finance.transactions.added'));
    } catch {
      toast.error(t('finance.transactions.addFailed'));
    }
  };

  const handleEdit = (tx: any) => {
    setEditingTx(tx);
    setAddOpen(true);
  };

  const getAccountName = (id: string | null) => {
    if (!id) return '—';
    return accounts.find(a => a.id === id)?.name ?? '—';
  };

  const activeAccountName = selectedAccountId !== 'all'
    ? accounts.find(a => a.id === selectedAccountId)?.name
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{t('finance.transactions.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('finance.transactions.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setCsvOpen(true)} className="rounded-xl border-border">
            <Upload className="w-4 h-4 mr-1" />{t('finance.transactions.importCsv')}
          </Button>
          <Button size="sm" onClick={() => { setEditingTx(null); setAddOpen(true); }} className="rounded-xl">
            <Plus className="w-4 h-4 mr-1" />{t('finance.transactions.add')}
          </Button>
        </div>
      </motion.div>

      {/* Active account filter badge */}
      {activeAccountName && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1.5">
            {activeAccountName}
            <button
              onClick={() => { setSelectedAccountId('all'); onClearAccountFilter?.(); }}
              className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('finance.transactions.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 finance-input h-10 rounded-xl"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[150px] h-10 bg-muted dark:bg-slate-800/60 border-border rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border rounded-xl">
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="debit">{t('finance.transactions.debit')}</SelectItem>
            <SelectItem value="credit">{t('finance.transactions.credit')}</SelectItem>
          </SelectContent>
        </Select>
        {accounts.length > 0 && (
          <Select value={selectedAccountId} onValueChange={(v) => { setSelectedAccountId(v); if (v === 'all') onClearAccountFilter?.(); }}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-muted dark:bg-slate-800/60 border-border rounded-xl">
              <SelectValue placeholder={t('finance.transactions.account')} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border rounded-xl">
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {accounts.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.icon_emoji} {a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </motion.div>

      {/* Results count */}
      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground tabular-nums">
          {filtered.length} {t('finance.transactions.title').toLowerCase()}
        </p>
      )}

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="neu-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">{t('finance.transactions.empty')}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{t('finance.transactions.emptyHint')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left p-4 font-medium">{t('finance.transactions.date')}</th>
                  <th className="text-left p-4 font-medium">{t('finance.transactions.description')}</th>
                  <th className="text-left p-4 font-medium hidden sm:table-cell">{t('finance.transactions.account')}</th>
                  <th className="text-left p-4 font-medium hidden md:table-cell">{t('finance.transactions.category')}</th>
                  <th className="text-right p-4 font-medium">{t('finance.recurring.amount')}</th>
                  {showRunningBalance && (
                    <th className="text-right p-4 font-medium hidden lg:table-cell">{t('finance.accounts.runningBalance')}</th>
                  )}
                  <th className="text-right p-4 font-medium w-24"></th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((tx, i) => (
                  <tr
                    key={tx.id}
                    className={`border-b border-border/50 hover:bg-muted/30 dark:hover:bg-white/[0.02] transition-colors group ${
                      i % 2 === 1 ? 'bg-muted/10 dark:bg-white/[0.01]' : ''
                    }`}
                  >
                    <td className="p-4 text-sm text-muted-foreground tabular-nums">
                      {format(parseISO(tx.transaction_date), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {tx.transaction_type === 'credit' ? (
                          <ArrowDownCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <ArrowUpCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="text-sm text-foreground truncate max-w-[200px]">{tx.description}</span>
                        {tx.source === 'csv_import' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium shrink-0">CSV</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell">{getAccountName(tx.account_id)}</td>
                    <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{tx.category ?? '—'}</td>
                    <td className={`p-4 text-sm font-semibold text-right tabular-nums ${tx.transaction_type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount), currency)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                          title={t('common.edit')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(tx)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="p-4 flex justify-center border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              {t('common.more')} ({filtered.length - visibleCount} {t('finance.transactions.title').toLowerCase()})
            </Button>
          </div>
        )}
      </motion.div>

      <AddTransactionModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditingTx(null); }}
        accounts={accounts}
        currency={currency}
        editingTransaction={editingTx}
      />
      <CsvImportModal
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        accounts={accounts}
        defaultDateFormat={financeSettings?.finance_csv_date_format}
        defaultDelimiter={financeSettings?.finance_csv_delimiter}
      />
    </div>
  );
}
