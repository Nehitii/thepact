import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Upload, Trash2, ArrowUpCircle, ArrowDownCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { AddTransactionModal } from './AddTransactionModal';
import { CsvImportModal } from './CsvImportModal';

export function TransactionsTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: transactions = [], isLoading } = useTransactions(user?.id);
  const { data: accounts = [] } = useAccounts(user?.id);
  const deleteTx = useDeleteTransaction();

  const [addOpen, setAddOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (typeFilter !== 'all' && tx.transaction_type !== typeFilter) return false;
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, search, typeFilter]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTx.mutateAsync(id);
      toast.success(t('finance.transactions.deleted'));
    } catch {
      toast.error(t('finance.transactions.deleteFailed'));
    }
  };

  const getAccountName = (id: string | null) => {
    if (!id) return '—';
    return accounts.find(a => a.id === id)?.name ?? '—';
  };

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
          <Button size="sm" onClick={() => setAddOpen(true)} className="rounded-xl">
            <Plus className="w-4 h-4 mr-1" />{t('finance.transactions.add')}
          </Button>
        </div>
      </motion.div>

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
      </motion.div>

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
                  <th className="text-right p-4 font-medium w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx, i) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 hover:bg-muted/30 dark:hover:bg-white/[0.02] transition-colors group"
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
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} accounts={accounts} currency={currency} />
      <CsvImportModal open={csvOpen} onClose={() => setCsvOpen(false)} accounts={accounts} />
    </div>
  );
}
