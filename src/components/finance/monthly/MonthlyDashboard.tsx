import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  useRecurringExpenses,
  useRecurringIncome,
  useAddRecurringExpense,
  useAddRecurringIncome,
  useUpdateRecurringExpense,
  useUpdateRecurringIncome,
  useDeleteRecurringExpense,
  useDeleteRecurringIncome,
  useMonthlyValidations,
} from '@/hooks/useFinance';
import { toast } from 'sonner';
import { MonthlyBalanceHero } from './MonthlyBalanceHero';
import { FinancialBlock } from './FinancialBlock';
import { MonthlyValidationPanel } from './MonthlyValidationPanel';
import { MonthlyHistory } from './MonthlyHistory';
import { format, subMonths } from 'date-fns';
import { 
  EXPENSE_CATEGORIES, 
  INCOME_CATEGORIES,
  getCategoryTotals,
  calculateActiveTotal,
} from '@/lib/financeCategories';

interface MonthlyDashboardProps {
  salaryPaymentDay: number;
}

export function MonthlyDashboard({ salaryPaymentDay }: MonthlyDashboardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const { data: expenses = [], isLoading: expensesLoading } = useRecurringExpenses(user?.id);
  const { data: income = [], isLoading: incomeLoading } = useRecurringIncome(user?.id);
  const { data: validations = [] } = useMonthlyValidations(user?.id);
  
  const addExpense = useAddRecurringExpense();
  const addIncome = useAddRecurringIncome();
  const updateExpense = useUpdateRecurringExpense();
  const updateIncome = useUpdateRecurringIncome();
  const deleteExpense = useDeleteRecurringExpense();
  const deleteIncome = useDeleteRecurringIncome();

  const totalExpenses = calculateActiveTotal(expenses);
  const totalIncome = calculateActiveTotal(income);

  // Compute 6-month balance trend from validations
  const balanceTrend = useMemo(() => {
    const now = new Date();
    const months: { month: string; label: string }[] = [];
    
    // Generate last 6 months (including current)
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      months.push({
        month: format(date, 'yyyy-MM'),
        label: format(date, 'MMM'),
      });
    }
    
    // Map validations to trend data
    return months.map(m => {
      const validation = validations.find(v => v.month === m.month);
      if (validation && validation.validated_at) {
        const balance = (validation.actual_total_income || 0) - (validation.actual_total_expenses || 0);
        return {
          month: m.month,
          label: m.label,
          balance,
        };
      }
      // For current month or unvalidated months, use current recurring totals as estimate
      if (m.month === format(now, 'yyyy-MM')) {
        return {
          month: m.month,
          label: m.label,
          balance: totalIncome - totalExpenses,
        };
      }
      // For past unvalidated months, skip or show null
      return {
        month: m.month,
        label: m.label,
        balance: 0,
      };
    });
  }, [validations, totalIncome, totalExpenses]);

  // Compute expenses by category for pie chart using shared utility
  const expensesByCategory = useMemo(() => 
    getCategoryTotals(expenses, EXPENSE_CATEGORIES), 
    [expenses]
  );

  // Compute income by category for pie chart using shared utility
  const incomeByCategory = useMemo(() => 
    getCategoryTotals(income, INCOME_CATEGORIES), 
    [income]
  );

  const handleAddExpense = async (name: string, amount: number, category?: string) => {
    if (expenses.length >= 30) {
      toast.error(t('finance.recurring.maxReached'));
      return;
    }
    try {
      await addExpense.mutateAsync({ name, amount, category });
      toast.success(t('finance.recurring.expenseAdded'));
    } catch (e) {
      toast.error(t('finance.recurring.addFailed'));
    }
  };

  const handleAddIncome = async (name: string, amount: number, category?: string) => {
    if (income.length >= 30) {
      toast.error(t('finance.recurring.maxReached'));
      return;
    }
    try {
      await addIncome.mutateAsync({ name, amount, category });
      toast.success(t('finance.recurring.incomeAdded'));
    } catch (e) {
      toast.error(t('finance.recurring.addFailed'));
    }
  };

  const handleUpdateExpense = async (id: string, name: string, amount: number, category?: string) => {
    try {
      await updateExpense.mutateAsync({ id, name, amount, category });
      toast.success(t('finance.recurring.expenseUpdated'));
    } catch (e) {
      toast.error(t('finance.recurring.updateFailed'));
    }
  };

  const handleUpdateIncome = async (id: string, name: string, amount: number, category?: string) => {
    try {
      await updateIncome.mutateAsync({ id, name, amount, category });
      toast.success(t('finance.recurring.incomeUpdated'));
    } catch (e) {
      toast.error(t('finance.recurring.updateFailed'));
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero: Monthly Balance with Pie Charts and Trend */}
      <MonthlyBalanceHero 
        totalIncome={totalIncome} 
        totalExpenses={totalExpenses}
        expensesByCategory={expensesByCategory}
        incomeByCategory={incomeByCategory}
        balanceTrend={balanceTrend}
      />
      {/* Two Column Layout: Expenses | Income */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses Block */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <FinancialBlock
            title="Recurring Expenses"
            type="expense"
            items={expenses}
            categories={EXPENSE_CATEGORIES}
            isLoading={expensesLoading}
            onAdd={handleAddExpense}
            onUpdate={handleUpdateExpense}
            onDelete={(id) => deleteExpense.mutate(id)}
            isPending={addExpense.isPending}
          />
        </motion.div>

        {/* Income Block */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <FinancialBlock
            title="Recurring Income"
            type="income"
            items={income}
            categories={INCOME_CATEGORIES}
            isLoading={incomeLoading}
            onAdd={handleAddIncome}
            onUpdate={handleUpdateIncome}
            onDelete={(id) => deleteIncome.mutate(id)}
            isPending={addIncome.isPending}
          />
        </motion.div>
      </div>

      {/* Validation Panel */}
      <MonthlyValidationPanel salaryPaymentDay={salaryPaymentDay} />

      {/* Monthly History - Collapsed by default */}
      <MonthlyHistory />
    </div>
  );
}
