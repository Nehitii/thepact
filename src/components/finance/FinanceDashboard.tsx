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
import { FinanceVaultHero } from './FinanceVaultHero';
import { FinanceTickerBar } from './FinanceTickerBar';
import { BankCellCard } from './widgets/BankCellCard';
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

  // Previous-month net (from validations) for MoM deltas
  const prevMonthKey = format(subMonths(new Date(), 1), 'yyyy-MM-01');
  const prevValidation = validations.find(v => v.month === prevMonthKey);
  const prevMonthIncome = prevValidation?.actual_total_income ?? null;
  const prevMonthExpenses = prevValidation?.actual_total_expenses ?? null;
  const prevMonthNet = prevValidation?.validated_at
    ? roundMoney((prevMonthIncome || 0) - (prevMonthExpenses || 0))
    : null;
  const prevSavingsRate = prevMonthIncome && prevMonthIncome > 0
    ? Math.round(((prevMonthNet || 0) / prevMonthIncome) * 100)
    : null;

  // 6-month sparkline series for KPIs (from balanceTrend)
  const netSeries = balanceTrend.map(b => b.balance);
  const savingsSeries = balanceTrend.map(b => {
    const v = validations.find(x => x.month === b.month);
    if (v?.validated_at && (v.actual_total_income || 0) > 0) {
      return Math.round((((v.actual_total_income || 0) - (v.actual_total_expenses || 0)) / (v.actual_total_income || 1)) * 100);
    }
    return b.month === format(new Date(), 'yyyy-MM-01') ? savingsRate : 0;
  });

  // Inline health score (0-100): savings (30) + budget compliance (25) + validation streak (25) + diversification (20)
  const healthScore = useMemo(() => {
    const sScore = Math.min(30, Math.max(0, Math.round(savingsRate * 1.5)));
    let bScore = 25;
    if (budgets.length > 0) {
      const over = budgets.filter(b => (txByCategory[b.category] || 0) > b.monthly_limit).length;
      bScore = Math.round((1 - over / budgets.length) * 25);
    }
    const streak = validations.filter(v => v.validated_at).length;
    const vScore = Math.min(25, streak * 4);
    const dScore = Math.min(20, incomeCategoryCount * 5);
    return Math.max(0, Math.min(100, sScore + bScore + vScore + dScore));
  }, [savingsRate, budgets, txByCategory, validations, incomeCategoryCount]);

  // Budget consumption %
  const budgetPct = useMemo(() => {
    if (budgets.length === 0) return null;
    const totalLimit = budgets.reduce((s, b) => s + b.monthly_limit, 0);
    const totalSpent = budgets.reduce((s, b) => s + (txByCategory[b.category] || 0), 0);
    return totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : null;
  }, [budgets, txByCategory]);

  // MoM deltas helpers
  const mom = (curr: number, prev: number | null) => {
    if (prev === null || prev === 0) return { label: null as string | null, positive: null as boolean | null };
    const diff = ((curr - prev) / Math.abs(prev)) * 100;
    return {
      label: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% ${t('finance.vault.mom', 'MoM')}`,
      positive: diff >= 0,
    };
  };

  const savingsMoM = mom(savingsRate, prevSavingsRate);
  const netMoM = mom(monthlyNet, prevMonthNet);

  return (
    <div className="space-y-6">
      {/* VAULT HERO */}
      <FinanceVaultHero
        netWorth={netWorth}
        monthlyNet={monthlyNet}
        totalExpenses={totalExpenses}
        prevMonthNet={prevMonthNet}
        healthScore={healthScore}
        transactions={transactions}
        accountsCount={accounts.filter(a => a.is_active).length}
      />

      {/* TICKER */}
      <FinanceTickerBar
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        monthlyNet={monthlyNet}
        budgetPct={budgetPct}
        alertCount={0}
      />

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

      {/* BANK CELLS — KPI premium */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BankCellCard
          icon={TrendingUp}
          label={t('finance.projections.savingsRate')}
          value={`${savingsRate}%`}
          status={savingsRate >= 20 ? 'positive' : savingsRate >= 0 ? 'neutral' : 'negative'}
          deltaLabel={savingsMoM.label}
          deltaPositive={savingsMoM.positive}
          sparkline={savingsSeries}
          delay={0}
        />
        <BankCellCard
          icon={BarChart3}
          label={t('finance.projections.monthlyNet')}
          value={`${monthlyNet >= 0 ? '+' : ''}${formatCurrency(monthlyNet, currency)}`}
          status={monthlyNet >= 0 ? 'positive' : 'negative'}
          deltaLabel={netMoM.label}
          deltaPositive={netMoM.positive}
          sparkline={netSeries}
          delay={0.05}
        />
        <BankCellCard
          icon={Wallet}
          label={t('finance.accounts.netWorth')}
          value={formatCurrency(netWorth, currency)}
          status={netWorth >= 0 ? 'neutral' : 'negative'}
          deltaLabel={null}
          deltaPositive={null}
          delay={0.1}
        />
        <BankCellCard
          icon={Target}
          label={t('finance.projections.toGoal')}
          value={monthsToGoal !== null ? `${monthsToGoal} ${t('finance.vault.mo', 'mo')}` : '—'}
          status={monthsToGoal !== null && monthsToGoal <= 24 ? 'positive' : 'warning'}
          deltaLabel={null}
          deltaPositive={null}
          delay={0.15}
        />
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

      {/* Health Score + Savings Rate + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <FinancialHealthScore
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            validations={validations}
            budgets={budgets}
            monthTransactionsByCategory={txByCategory}
            incomeCategories={incomeCategoryCount}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="neu-inset p-5 rounded-2xl flex items-center gap-4 h-full">
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
