import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, GitCompareArrows } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import type { MonthlyValidation } from '@/types/finance';
import { format, subMonths } from 'date-fns';

interface MonthComparisonWidgetProps {
  validations: MonthlyValidation[];
  currentIncome: number;
  currentExpenses: number;
  currency: string;
}

export function MonthComparisonWidget({ validations, currentIncome, currentExpenses, currency }: MonthComparisonWidgetProps) {
  const { t } = useTranslation();

  const comparison = useMemo(() => {
    const now = new Date();
    const currentMonth = format(now, 'yyyy-MM');
    const prevMonth = format(subMonths(now, 1), 'yyyy-MM');
    
    const prevValidation = validations.find(v => v.month === prevMonth && v.validated_at);
    
    const currentNet = currentIncome - currentExpenses;
    const prevNet = prevValidation 
      ? (prevValidation.actual_total_income || 0) - (prevValidation.actual_total_expenses || 0)
      : null;

    const netDiff = prevNet !== null ? currentNet - prevNet : null;
    const incomeDiff = prevValidation ? currentIncome - (prevValidation.actual_total_income || 0) : null;
    const expenseDiff = prevValidation ? currentExpenses - (prevValidation.actual_total_expenses || 0) : null;

    return { currentNet, prevNet, netDiff, incomeDiff, expenseDiff, hasPrevious: !!prevValidation };
  }, [validations, currentIncome, currentExpenses]);

  const DiffIndicator = ({ value }: { value: number | null }) => {
    if (value === null) return <Minus className="w-3 h-3 text-muted-foreground" />;
    if (value > 0) return <ArrowUp className="w-3 h-3 text-emerald-400" />;
    if (value < 0) return <ArrowDown className="w-3 h-3 text-rose-400" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  const diffColor = (val: number | null, invert = false) => {
    if (val === null) return 'text-muted-foreground';
    const positive = invert ? val < 0 : val > 0;
    return positive ? 'text-emerald-400' : val === 0 ? 'text-muted-foreground' : 'text-rose-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="neu-inset p-5 rounded-2xl"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <GitCompareArrows className="w-4 h-4 text-primary" />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t('finance.analytics.monthComparison')}
        </span>
      </div>

      {!comparison.hasPrevious ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t('finance.analytics.noPreviousMonth')}</p>
      ) : (
        <div className="space-y-3">
          {[
            { label: t('finance.monthly.income'), diff: comparison.incomeDiff, invert: false },
            { label: t('finance.monthly.expenses'), diff: comparison.expenseDiff, invert: true },
            { label: t('finance.projections.monthlyNet'), diff: comparison.netDiff, invert: false },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <div className={`flex items-center gap-1.5 text-xs font-semibold tabular-nums ${diffColor(row.diff, row.invert)}`}>
                <DiffIndicator value={row.diff !== null ? (row.invert ? -(row.diff) : row.diff) : null} />
                {row.diff !== null ? `${row.diff > 0 ? '+' : ''}${formatCurrency(row.diff, currency)}` : '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
