import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Target, Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import {
  useRecurringExpenses,
  useRecurringIncome,
  useMonthlyValidations,
} from '@/hooks/useFinance';
import { useAccounts } from '@/hooks/useAccounts';
import { useAccountBalances } from '@/hooks/useAccountBalances';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategoryBudgets } from '@/hooks/useBudgets';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getCategoryTotals,
  calculateActiveTotal,
  roundMoney,
  getCategoryLabel,
} from '@/lib/financeCategories';
import { FinanceOverviewCard } from './FinanceOverviewCard';
import {
  BalanceTrendSparkline,
  CategoryDonut,
  SavingsRateRing,
  MonthComparisonWidget,
  TopCategoriesBar,
  CategoryTrendsChart,
} from './widgets';
import { format, subMonths } from 'date-fns';
import { FinancialHealthScore } from './widgets/FinancialHealthScore';
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
  const { data: accounts = [] } = useAccounts(user?.id);
  const { data: balancesMap } = useAccountBalances(accounts, user?.id);
  const { data: transactions = [] } = useTransactions(user?.id);
  const { data: budgets = [] } = useCategoryBudgets(user?.id);

  const totalExpenses = calculateActiveTotal(expenses);
  const totalIncome = calculateActiveTotal(income);
  const monthlyNet = roundMoney(totalIncome - totalExpenses);
  const savingsRate = totalIncome > 0 ? Math.round((monthlyNet / totalIncome) * 100) : 0;
  const yearlyProjection = roundMoney(monthlyNet * 12);
  const monthsToGoal = monthlyAllocation > 0 ? Math.ceil(totalRemaining / monthlyAllocation) : null;

  // Use computed balances (initial + transactions) instead of static DB balance
  const netWorth = useMemo(() => {
    const activeAccounts = accounts.filter(a => a.is_active);
    if (!balancesMap || balancesMap.size === 0) {
      return roundMoney(activeAccounts.reduce((sum, a) => sum + a.balance, 0));
    }
    return roundMoney(activeAccounts.reduce((sum, a) => {
      const computed = balancesMap.get(a.id);
      return sum + (computed ? computed.computedBalance : a.balance);
    }, 0));
  }, [accounts, balancesMap]);

  const expensesByCategory = useMemo(() => getCategoryTotals(expenses, EXPENSE_CATEGORIES, t), [expenses, t]);
  const incomeByCategory = useMemo(() => getCategoryTotals(income, INCOME_CATEGORIES, t), [income, t]);

  // Compute month transaction totals by category for health score + alerts
  const currentMonth = format(new Date(), 'yyyy-MM-01');
  const { txByCategory, incomeCategoryCount } = useMemo(() => {
    const currentMonthTxs = transactions.filter(tx => tx.transaction_date >= currentMonth);
    const map: Record<string, number> = {};
    const incCats = new Set<string>();
    currentMonthTxs.forEach(tx => {
      if (tx.transaction_type === 'debit' && tx.category) {
        map[tx.category] = roundMoney((map[tx.category] || 0) + Number(tx.amount));
      }
      if (tx.transaction_type === 'credit' && tx.category) {
        incCats.add(tx.category);
      }
    });
    // Also count recurring income categories
    income.filter(i => i.is_active && i.category).forEach(i => incCats.add(i.category!));
    return { txByCategory: map, incomeCategoryCount: Math.max(incCats.size, 1) };
  }, [transactions, currentMonth, income]);
  // Alerts system
  const alerts = useMemo(() => {
    const result: Array<{ type: 'warning' | 'danger' | 'info'; message: string }> = [];

    if (monthlyNet < 0) {
      result.push({ type: 'danger', message: t('finance.alerts.negativeNet', { amount: formatCurrency(Math.abs(monthlyNet), currency) }) });
    }

    budgets.forEach(budget => {
      const spent = txByCategory[budget.category] || 0;
      const pct = budget.monthly_limit > 0 ? (spent / budget.monthly_limit) * 100 : 0;
      if (pct > 100) {
        const cat = EXPENSE_CATEGORIES.find(c => c.value === budget.category);
        const label = cat ? getCategoryLabel(cat, t) : budget.category;
        result.push({ type: 'warning', message: t('finance.alerts.budgetExceeded', { category: label, amount: formatCurrency(roundMoney(spent - budget.monthly_limit), currency) }) });
      }
    });

    const prevMonth = format(subMonths(new Date(), 1), 'yyyy-MM-01');
    const prevValidation = validations.find(v => v.month === prevMonth);
    if (!prevValidation?.validated_at) {
      result.push({ type: 'info', message: t('finance.alerts.pendingValidation') });
    }

    return result;
  }, [monthlyNet, txByCategory, budgets, validations, t, currency]);

  const balanceTrend = useMemo(() => {
    const now = new Date();
    const months: { month: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      months.push({ month: format(date, 'yyyy-MM-01'), label: format(date, 'MMM') });
    }
    return months.map(m => {
      const validation = validations.find(v => v.month === m.month);
      if (validation && validation.validated_at) {
        return { month: m.month, label: m.label, balance: roundMoney((validation.actual_total_income || 0) - (validation.actual_total_expenses || 0)) };
      }
      if (m.month === format(now, 'yyyy-MM-01')) {
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
      icon: Wallet,
      label: t('finance.accounts.netWorth'),
      value: formatCurrency(netWorth, currency),
      color: netWorth >= 0 ? 'text-foreground' : 'text-rose-400',
    },
    {
      icon: Target,
      label: t('finance.projections.toGoal'),
      value: monthsToGoal !== null ? `${monthsToGoal} mo` : '—',
      color: 'text-foreground',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                alert.type === 'danger'
                  ? 'bg-rose-500/[0.06] border-rose-500/20 text-rose-400'
                  : alert.type === 'warning'
                  ? 'bg-amber-500/[0.06] border-amber-500/20 text-amber-400'
                  : 'bg-primary/[0.06] border-primary/20 text-primary'
              }`}
            >
              {alert.type === 'danger' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : alert.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="text-sm font-medium">{alert.message}</span>
            </motion.div>
          ))}
        </div>
      )}

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
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</span>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold tabular-nums break-all ${kpi.color}`}>{kpi.value}</p>
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

      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <CategoryDonut data={incomeByCategory} currency={currency} title={t('finance.monthly.income')} total={totalIncome} colorAccent="emerald" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <CategoryDonut data={expensesByCategory} currency={currency} title={t('finance.monthly.expenses')} total={totalExpenses} colorAccent="rose" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <MonthComparisonWidget validations={validations} currentIncome={totalIncome} currentExpenses={totalExpenses} currency={currency} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <TopCategoriesBar data={expensesByCategory} currency={currency} />
        </motion.div>
      </div>

      {/* Savings Rate + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <div className="neu-inset p-5 rounded-2xl flex items-center gap-4">
            <SavingsRateRing rate={savingsRate} size={72} />
            <div>
              <p className="text-sm font-semibold text-foreground">{t('finance.projections.savingsRate')}</p>
              <p className="text-xs text-muted-foreground">
                {savingsRate >= 0 ? t('finance.projections.positiveBalance') : t('finance.projections.negativeBalance')}
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums mt-1">
                {formatCurrency(yearlyProjection, currency)}<span className="text-xs text-muted-foreground font-normal ml-1">/{t('finance.analytics.perYear')}</span>
              </p>
            </div>
          </div>
        </motion.div>
        <BalanceTrendSparkline data={balanceTrend} currency={currency} />
      </div>

      <CategoryTrendsChart validations={validations} currency={currency} />
    </div>
  );
}
