import { useState, useEffect } from 'react';
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
import { ValidationFlowModal } from './validation/ValidationFlowModal';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  calculateActiveTotal,
} from '@/lib/financeCategories';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useMonthlyValidation, useUpsertMonthlyValidation } from '@/hooks/useFinance';

interface MonthlyDashboardProps {
  salaryPaymentDay: number;
}

export function MonthlyDashboard({ salaryPaymentDay }: MonthlyDashboardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();

  const { data: expenses = [], isLoading: expensesLoading } = useRecurringExpenses(user?.id);
  const { data: income = [], isLoading: incomeLoading } = useRecurringIncome(user?.id);

  const addExpense = useAddRecurringExpense();
  const addIncome = useAddRecurringIncome();
  const updateExpense = useUpdateRecurringExpense();
  const updateIncome = useUpdateRecurringIncome();
  const deleteExpense = useDeleteRecurringExpense();
  const deleteIncome = useDeleteRecurringIncome();
  const upsertValidation = useUpsertMonthlyValidation();

  // Editing past month state
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const { data: editingValidation } = useMonthlyValidation(user?.id, editingMonth ?? undefined);

  // Validation modal state for editing past months
  const [editConfirmedExpenses, setEditConfirmedExpenses] = useState(false);
  const [editConfirmedIncome, setEditConfirmedIncome] = useState(false);
  const [editUnplannedExpenses, setEditUnplannedExpenses] = useState('');
  const [editUnplannedIncome, setEditUnplannedIncome] = useState('');

  const totalExpenses = calculateActiveTotal(expenses);
  const totalIncome = calculateActiveTotal(income);

  // When editingMonth changes and data loads, pre-populate
  useEffect(() => {
    if (editingValidation) {
      setEditConfirmedExpenses(editingValidation.confirmed_expenses);
      setEditConfirmedIncome(editingValidation.confirmed_income);
      setEditUnplannedExpenses(editingValidation.unplanned_expenses?.toString() ?? '0');
      setEditUnplannedIncome(editingValidation.unplanned_income?.toString() ?? '0');
    } else if (editingMonth) {
      setEditConfirmedExpenses(false);
      setEditConfirmedIncome(false);
      setEditUnplannedExpenses('0');
      setEditUnplannedIncome('0');
    }
  }, [editingValidation, editingMonth]);

  const handleEditValidate = async (overrides?: { actualIncome?: number; actualExpenses?: number }) => {
    if (!editingMonth) return;
    const totalActualIncome = overrides?.actualIncome ?? (totalIncome + (parseFloat(editUnplannedIncome) || 0));
    const totalActualExpenses = overrides?.actualExpenses ?? (totalExpenses + (parseFloat(editUnplannedExpenses) || 0));
    try {
      await upsertValidation.mutateAsync({
        month: editingMonth,
        confirmed_expenses: editConfirmedExpenses,
        confirmed_income: editConfirmedIncome,
        unplanned_expenses: parseFloat(editUnplannedExpenses) || 0,
        unplanned_income: parseFloat(editUnplannedIncome) || 0,
        actual_total_income: totalActualIncome,
        actual_total_expenses: totalActualExpenses,
        validated_at: new Date().toISOString(),
      });
      toast.success(t('finance.monthly.validated'));
      setEditingMonth(null);
    } catch {
      toast.error(t('finance.monthly.validationFailed'));
    }
  };

  const handleAddExpense = async (name: string, amount: number, category?: string, iconEmoji?: string, iconUrl?: string) => {
    if (expenses.length >= 30) { toast.error(t('finance.recurring.maxReached')); return; }
    try { await addExpense.mutateAsync({ name, amount, category, icon_emoji: iconEmoji, icon_url: iconUrl }); toast.success(t('finance.recurring.expenseAdded')); }
    catch { toast.error(t('finance.recurring.addFailed')); }
  };

  const handleAddIncome = async (name: string, amount: number, category?: string, iconEmoji?: string, iconUrl?: string) => {
    if (income.length >= 30) { toast.error(t('finance.recurring.maxReached')); return; }
    try { await addIncome.mutateAsync({ name, amount, category, icon_emoji: iconEmoji, icon_url: iconUrl }); toast.success(t('finance.recurring.incomeAdded')); }
    catch { toast.error(t('finance.recurring.addFailed')); }
  };

  const handleUpdateExpense = async (id: string, name: string, amount: number, category?: string, iconEmoji?: string, iconUrl?: string) => {
    try { await updateExpense.mutateAsync({ id, name, amount, category, icon_emoji: iconEmoji, icon_url: iconUrl }); toast.success(t('finance.recurring.expenseUpdated')); }
    catch { toast.error(t('finance.recurring.updateFailed')); }
  };

  const handleUpdateIncome = async (id: string, name: string, amount: number, category?: string, iconEmoji?: string, iconUrl?: string) => {
    try { await updateIncome.mutateAsync({ id, name, amount, category, icon_emoji: iconEmoji, icon_url: iconUrl }); toast.success(t('finance.recurring.incomeUpdated')); }
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
      <MonthlyHistory onEditMonth={(month) => setEditingMonth(month)} />

      {/* Edit past month validation modal */}
      {editingMonth && (
        <ValidationFlowModal
          onClose={() => setEditingMonth(null)}
          onValidate={handleEditValidate}
          isPending={upsertValidation.isPending}
          recurringExpenses={expenses}
          recurringIncome={income}
          confirmedExpenses={editConfirmedExpenses}
          confirmedIncome={editConfirmedIncome}
          setConfirmedExpenses={setEditConfirmedExpenses}
          setConfirmedIncome={setEditConfirmedIncome}
          unplannedExpenses={editUnplannedExpenses}
          unplannedIncome={editUnplannedIncome}
          setUnplannedExpenses={setEditUnplannedExpenses}
          setUnplannedIncome={setEditUnplannedIncome}
          currency={currency}
          isEditing
          initialActualIncome={editingValidation?.actual_total_income ?? undefined}
          initialActualExpenses={editingValidation?.actual_total_expenses ?? undefined}
        />
      )}
    </div>
  );
}
