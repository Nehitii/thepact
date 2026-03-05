import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import {
  useRecurringExpenses,
  useRecurringIncome,
  useMonthlyValidations,
} from '@/hooks/useFinance';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getCategoryTotals,
  calculateActiveTotal,
} from '@/lib/financeCategories';
import { FinanceOverviewCard } from './FinanceOverviewCard';
import { BalanceTrendSparkline, CategoryDonut, SavingsRateRing } from './widgets';
import { format, subMonths } from 'date-fns';

interface FinanceDashboardProps {
  totalEstimated: number;
  totalPaid: number;
  totalRemaining: number;
  isCustomMode: boolean;
  monthlyAllocation: number;
}

export function FinanceDashboard({
  totalEstimated,
  totalPaid,
  totalRemaining,
  isCustomMode,
  monthlyAllocation,
}: FinanceDashboardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();

  const { data: expenses = [] } = useRecurringExpenses(user?.id);
  const { data: income = [] } = useRecurringIncome(user?.id);
  const { data: validations = [] } = useMonthlyValidations(user?.id);

  const totalExpenses = calculateActiveTotal(expenses);
  const totalIncome = calculateActiveTotal(income);
  const monthlyNet = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((monthlyNet / totalIncome) * 100) : 0;
  const yearlyProjection = monthlyNet * 12;
  const monthsToGoal = monthlyAllocation > 0 ? Math.ceil(totalRemaining / monthlyAllocation) : null;

  const expensesByCategory = useMemo(() => getCategoryTotals(expenses, EXPENSE_CATEGORIES), [expenses]);
  const incomeByCategory = useMemo(() => getCategoryTotals(income, INCOME_CATEGORIES), [income]);

  const balanceTrend = useMemo(() => {
    const now = new Date();
    const months: { month: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      months.push({ month: format(date, 'yyyy-MM'), label: format(date, 'MMM') });
    }
    return months.map(m => {
      const validation = validations.find(v => v.month === m.month);
      if (validation && validation.validated_at) {
        return { month: m.month, label: m.label, balance: (validation.actual_total_income || 0) - (validation.actual_total_expenses || 0) };
      }
      if (m.month === format(now, 'yyyy-MM')) {
        return { month: m.month, label: m.label, balance: monthlyNet };
      }
      return { month: m.month, label: m.label, balance: 0 };
    });
  }, [validations, monthlyNet]);

  const kpis = [
    {
      icon: TrendingUp,
      label: t('finance.projections.savingsRate'),
      value: `${savingsRate}%`,
      color: savingsRate >= 0 ? 'text-emerald-400' : 'text-rose-400',
    },
    {
      icon: BarChart3,
      label: t('finance.projections.monthlyNet'),
      value: `${monthlyNet >= 0 ? '+' : ''}${formatCurrency(monthlyNet, currency)}`,
      color: monthlyNet >= 0 ? 'text-emerald-400' : 'text-rose-400',
    },
    {
      icon: TrendingUp,
      label: t('finance.projections.yearly'),
      value: `${yearlyProjection >= 0 ? '+' : ''}${formatCurrency(yearlyProjection, currency)}`,
      color: yearlyProjection >= 0 ? 'text-emerald-400' : 'text-rose-400',
    },
    {
      icon: Target,
      label: t('finance.projections.toGoal'),
      value: monthsToGoal !== null ? `${monthsToGoal} mo` : '—',
      color: 'text-white',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="neu-card p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <kpi.icon className="h-4 w-4 text-primary" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{kpi.label}</span>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Project Funding */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <FinanceOverviewCard
          totalEstimated={totalEstimated}
          totalPaid={totalPaid}
          totalRemaining={totalRemaining}
          isCustomMode={isCustomMode}
        />
      </motion.div>

      {/* Donuts + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <CategoryDonut
            data={incomeByCategory}
            currency={currency}
            title={t('finance.monthly.income')}
            total={totalIncome}
            colorAccent="emerald"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <CategoryDonut
            data={expensesByCategory}
            currency={currency}
            title={t('finance.monthly.expenses')}
            total={totalExpenses}
            colorAccent="rose"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex flex-col gap-4">
            <div className="neu-inset p-5 rounded-2xl flex items-center gap-4">
              <SavingsRateRing rate={savingsRate} size={72} />
              <div>
                <p className="text-sm font-semibold text-white">{t('finance.projections.savingsRate')}</p>
                <p className="text-xs text-slate-500">
                  {savingsRate >= 0
                    ? t('finance.projections.positiveBalance')
                    : t('finance.projections.negativeBalance')}
                </p>
              </div>
            </div>
            <BalanceTrendSparkline data={balanceTrend} currency={currency} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
