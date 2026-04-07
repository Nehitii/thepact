import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Upload, Trash2, Edit2, Copy, ArrowUpCircle, ArrowDownCircle, Search, X, ChevronDown, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { roundMoney } from '@/lib/financeCategories';
import { useTransactions, useDeleteTransaction, useDeleteTransactionsBatch, useAddTransaction } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useAccountBalances } from '@/hooks/useAccountBalances';
import { exportTransactions } from '@/lib/financeExport';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { AddTransactionModal } from './AddTransactionModal';
import { CsvImportModal } from './CsvImportModal';
import type { BankTransaction, UserAccount } from '@/types/finance';

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

  // Date range filter
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: transactions = [], isLoading } = useTransactions(
    user?.id,
    dateFrom || dateTo ? { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined } : undefined
  );
  const { data: accounts = [] } = useAccounts(user?.id);
  const { data: balancesMap } = useAccountBalances(accounts, user?.id);
  const deleteTx = useDeleteTransaction();
  const deleteBatch = useDeleteTransactionsBatch();
  const duplicateTx = useAddTransaction();

  const [addOpen, setAddOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [editingTx, setEditingTx] = useState<BankTransaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (accountFilter) setSelectedAccountId(accountFilter);
  }, [accountFilter]);

  const filtered = useMemo(() => {
    return transactions.filter((tx: BankTransaction) => {
      if (typeFilter !== 'all' && tx.transaction_type !== typeFilter) return false;
      if (selectedAccountId !== 'all' && tx.account_id !== selectedAccountId) return false;
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, search, typeFilter, selectedAccountId]);

  const showRunningBalance = selectedAccountId !== 'all';

  const runningBalances = useMemo(() => {
    if (!showRunningBalance) return new Map<string, number>();
    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) return new Map<string, number>();

    const initial = account.initial_balance ?? account.balance ?? 0;
    const balanceDate = account.balance_date || account.created_at?.split('T')[0] || '1970-01-01';

    const sorted = [...filtered].sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));
    const map = new Map<string, number>();
    let running = initial;

    for (const tx of sorted) {
      if (tx.transaction_date >= balanceDate) {
        if (tx.transaction_type === 'credit') running += Number(tx.amount);
        else running -= Number(tx.amount);
      }
      map.set(tx.id, roundMoney(running));
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

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await deleteBatch.mutateAsync(Array.from(selectedIds));
      toast.success(t('finance.transactions.deleted'));
      setSelectedIds(new Set());
    } catch {
      toast.error(t('finance.transactions.deleteFailed'));
    }
  };

  const handleDuplicate = async (tx: BankTransaction) => {
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

  const handleEdit = (tx: BankTransaction) => {
    setEditingTx(tx);
    setAddOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleItems.map(tx => tx.id)));
    }
  };

  const getAccountName = (id: string | null) => {
    if (!id) return '—';
    return accounts.find(a => a.id === id)?.name ?? '—';
  };

  const activeAccountName = selectedAccountId !== 'all'
    ? accounts.find(a => a.id === selectedAccountId)?.name
    : null;

  // Quick month preset
  const setCurrentMonth = () => {
    const now = new Date();
    setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'));
    setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'));
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setEditingTx(null);
        setAddOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{t('finance.transactions.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('finance.transactions.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {filtered.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => exportTransactions(filtered as BankTransaction[], accounts)} className="rounded-xl border-border">
              <Download className="w-4 h-4 mr-1" />{t('finance.transactions.export')}
            </Button>
          )}
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
            <button onClick={() => { setSelectedAccountId('all'); onClearAccountFilter?.(); }} className="hover:bg-primary/20 rounded-full p-0.5 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t('finance.transactions.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 finance-input h-10 rounded-xl" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[150px] h-10 bg-muted dark:bg-slate-800/60 border-border rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover border-border rounded-xl">
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="debit">{t('finance.transactions.debit')}</SelectItem>
              <SelectItem value="credit">{t('finance.transactions.credit')}</SelectItem>
            </SelectContent>
          </Select>
          {accounts.length > 0 && (
            <Select value={selectedAccountId} onValueChange={(v) => { setSelectedAccountId(v); if (v === 'all') onClearAccountFilter?.(); }}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 bg-muted dark:bg-slate-800/60 border-border rounded-xl"><SelectValue placeholder={t('finance.transactions.account')} /></SelectTrigger>
              <SelectContent className="bg-popover border-border rounded-xl">
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {accounts.map(a => (<SelectItem key={a.id} value={a.id}>{a.icon_emoji} {a.name}</SelectItem>))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="finance-input h-9 w-[150px] text-xs rounded-lg" placeholder="From" />
          <span className="text-xs text-muted-foreground">→</span>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="finance-input h-9 w-[150px] text-xs rounded-lg" placeholder="To" />
          <Button size="sm" variant="ghost" onClick={setCurrentMonth} className="text-xs h-8 rounded-lg">
            {t('finance.transactions.thisMonth')}
          </Button>
          {(dateFrom || dateTo) && (
            <Button size="sm" variant="ghost" onClick={clearDateFilter} className="text-xs h-8 rounded-lg text-muted-foreground">
              <X className="w-3 h-3 mr-1" />{t('common.reset')}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Results count */}
      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground tabular-nums">
          {filtered.length} {t('finance.transactions.title').toLowerCase()}
        </p>
      )}

      {/* Batch action bar */}
      {selectedIds.size > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-rose-500/[0.06] border border-rose-500/20"
        >
          <span className="text-sm font-medium text-rose-400">{selectedIds.size} {t('common.selected')}</span>
          <Button size="sm" variant="ghost" onClick={handleBatchDelete} disabled={deleteBatch.isPending}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs h-7">
            <Trash2 className="w-3.5 h-3.5 mr-1" />{t('common.delete')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="text-xs h-7 text-muted-foreground ml-auto">
            {t('common.cancel')}
          </Button>
        </motion.div>
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
                  <th className="p-4 w-10">
                    <Checkbox
                      checked={selectedIds.size === visibleItems.length && visibleItems.length > 0}
                      onCheckedChange={toggleSelectAll}
                      className="border-border"
                    />
                  </th>
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
                    } ${selectedIds.has(tx.id) ? 'bg-primary/5' : ''}`}
                  >
                    <td className="p-4">
                      <Checkbox
                        checked={selectedIds.has(tx.id)}
                        onCheckedChange={() => toggleSelect(tx.id)}
                        className="border-border"
                      />
                    </td>
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
                    {showRunningBalance && (
                      <td className="p-4 text-sm text-right tabular-nums hidden lg:table-cell">
                        {runningBalances.has(tx.id) ? (
                          <span className={runningBalances.get(tx.id)! >= 0 ? 'text-foreground' : 'text-rose-400'}>
                            {formatCurrency(runningBalances.get(tx.id)!, currency)}
                          </span>
                        ) : '—'}
                      </td>
                    )}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(tx as BankTransaction)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title={t('common.edit')}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDuplicate(tx as BankTransaction)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" title="Duplicate">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(tx.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all" title={t('common.delete')}>
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

        {hasMore && (
          <div className="p-4 flex justify-center border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="text-xs text-muted-foreground hover:text-foreground gap-1.5">
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
