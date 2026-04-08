import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAddTransactionsBatch } from '@/hooks/useTransactions';
import { roundMoney } from '@/lib/financeCategories';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { RecurringExpense, RecurringIncome } from '@/types/finance';

interface AutoGenerateTransactionsProps {
  expenses: RecurringExpense[];
  income: RecurringIncome[];
  defaultAccountId?: string | null;
  salaryPaymentDay: number;
}

export function AutoGenerateTransactions({
  expenses,
  income,
  defaultAccountId,
  salaryPaymentDay,
}: AutoGenerateTransactionsProps) {
  const { t } = useTranslation();
  const addBatch = useAddTransactionsBatch();
  const [generated, setGenerated] = useState(false);

  const activeExpenses = expenses.filter(e => e.is_active);
  const activeIncome = income.filter(i => i.is_active);
  const totalItems = activeExpenses.length + activeIncome.length;

  const handleGenerate = async () => {
    if (totalItems === 0) return;

    const now = new Date();
    const currentMonth = format(now, 'yyyy-MM');
    const txDate = format(now, 'yyyy-MM-dd');
    const salaryDate = `${currentMonth}-${String(salaryPaymentDay).padStart(2, '0')}`;

    const transactions = [
      ...activeExpenses.map(e => ({
        description: e.name,
        amount: roundMoney(e.amount),
        transaction_type: 'debit' as const,
        transaction_date: txDate,
        category: e.category || undefined,
        note: t('finance.autoGenerate.autoNote'),
        account_id: defaultAccountId || undefined,
        source: 'manual' as const,
      })),
      ...activeIncome.map(i => ({
        description: i.name,
        amount: roundMoney(i.amount),
        transaction_type: 'credit' as const,
        transaction_date: salaryDate,
        category: i.category || undefined,
        note: t('finance.autoGenerate.autoNote'),
        account_id: defaultAccountId || undefined,
        source: 'manual' as const,
      })),
    ];

    try {
      await addBatch.mutateAsync(transactions);
      setGenerated(true);
      toast.success(t('finance.autoGenerate.success', { count: transactions.length }));
      setTimeout(() => setGenerated(false), 3000);
    } catch {
      toast.error(t('finance.autoGenerate.error'));
    }
  };

  if (totalItems === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="neu-inset rounded-xl p-4 flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 shrink-0">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{t('finance.autoGenerate.title')}</p>
          <p className="text-[11px] text-muted-foreground">{t('finance.autoGenerate.description', { count: totalItems })}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleGenerate}
        disabled={addBatch.isPending || generated}
        className="rounded-xl border-border shrink-0"
      >
        <AnimatePresence mode="wait">
          {generated ? (
            <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">{t('common.done')}</span>
            </motion.span>
          ) : (
            <motion.span key="gen" className="flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${addBatch.isPending ? 'animate-spin' : ''}`} />
              <span>{t('finance.autoGenerate.generate')}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}
