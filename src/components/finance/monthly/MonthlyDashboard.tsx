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
} from '@/hooks/useFinance';
import { toast } from 'sonner';
import { MonthlyBalanceHero } from './MonthlyBalanceHero';
import { FinancialBlock } from './FinancialBlock';
import { MonthlyValidationPanel } from './MonthlyValidationPanel';
import { MonthlyHistory } from './MonthlyHistory';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
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

  const addExpense = useAddRecurringExpense();
  const addIncome = useAddRecurringIncome();
  const updateExpense = useUpdateRecurringExpense();
  const updateIncome = useUpdateRecurringIncome();
  const deleteExpense = useDeleteRecurringExpense();
  const deleteIncome = useDeleteRecurringIncome();

  const totalExpenses = calculateActiveTotal(expenses);
  const totalIncome = calculateActiveTotal(income);

  const handleAddExpense = async (name: string, amount: number, category?: string) => {
    if (expenses.length >= 30) { toast.error(t('finance.recurring.maxReached')); return; }
    try { await addExpense.mutateAsync({ name, amount, category }); toast.success(t('finance.recurring.expenseAdded')); }
    catch { toast.error(t('finance.recurring.addFailed')); }
  };

  const handleAddIncome = async (name: string, amount: number, category?: string) => {
    if (income.length >= 30) { toast.error(t('finance.recurring.maxReached')); return; }
    try { await addIncome.mutateAsync({ name, amount, category }); toast.success(t('finance.recurring.incomeAdded')); }
    catch { toast.error(t('finance.recurring.addFailed')); }
  };

  const handleUpdateExpense = async (id: string, name: string, amount: number, category?: string) => {
    try { await updateExpense.mutateAsync({ id, name, amount, category }); toast.success(t('finance.recurring.expenseUpdated')); }
    catch { toast.error(t('finance.recurring.updateFailed')); }
  };

  const handleUpdateIncome = async (id: string, name: string, amount: number, category?: string) => {
    try { await updateIncome.mutateAsync({ id, name, amount, category }); toast.success(t('finance.recurring.incomeUpdated')); }
    catch { toast.error(t('finance.recurring.updateFailed')); }
  };

  const handleToggleExpense = async (id: string, isActive: boolean) => {
    try { await updateExpense.mutateAsync({ id, is_active: isActive }); }
    catch { toast.error(t('finance.recurring.updateFailed')); }
  };

  const handleToggleIncome = async (id: string, isActive: boolean) => {
    try { await updateIncome.mutateAsync({ id, is_active: isActive }); }
    catch { toast.error(t('finance.recurring.updateFailed')); }
  };

  return (
    <div className="space-y-8">
      <MonthlyBalanceHero totalIncome={totalIncome} totalExpenses={totalExpenses} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <FinancialBlock
            title={t('finance.recurring.expenses')}
            type="expense"
            items={expenses}
            categories={EXPENSE_CATEGORIES}
            isLoading={expensesLoading}
            onAdd={handleAddExpense}
            onUpdate={handleUpdateExpense}
            onDelete={(id) => deleteExpense.mutate(id)}
            onToggleActive={handleToggleExpense}
            isPending={addExpense.isPending}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <FinancialBlock
            title={t('finance.recurring.income')}
            type="income"
            items={income}
            categories={INCOME_CATEGORIES}
            isLoading={incomeLoading}
            onAdd={handleAddIncome}
            onUpdate={handleUpdateIncome}
            onDelete={(id) => deleteIncome.mutate(id)}
            onToggleActive={handleToggleIncome}
            isPending={addIncome.isPending}
          />
        </motion.div>
      </div>

      <MonthlyValidationPanel salaryPaymentDay={salaryPaymentDay} />
      <MonthlyHistory />
    </div>
  );
}
