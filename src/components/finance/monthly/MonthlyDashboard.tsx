import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { totalDuMois, provisionMensuelle } from '@/lib/finance/cadence';
import type { ValeursLigne } from './LigneRecurrente';
import { toast } from 'sonner';
import { MonthlyBalanceHero } from './MonthlyBalanceHero';
import { MoisPalmares } from './MoisPalmares';
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
import { useMonthlyValidation, useUpsertMonthlyValidation, useFinanceSettings } from '@/hooks/useFinance';

interface MonthlyDashboardProps {
  salaryPaymentDay: number;
  /** Ce qu il reste a financer : le palmares en tire la part versee. */
  restantPacte: number;
}

export function MonthlyDashboard({ salaryPaymentDay, restantPacte }: MonthlyDashboardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: finSettings } = useFinanceSettings(user?.id);

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

  /* Le palmares appelle a valider ; le panneau qui valide est plus
     bas. On y emmene, et il s annonce une fois en arrivant. */
  const refValidation = useRef<HTMLDivElement>(null);
  const allerValider = useCallback(() => {
    const cible = refValidation.current;
    if (!cible) return;
    const douceur = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    cible.scrollIntoView({ behavior: douceur, block: 'center' });
    cible.focus({ preventScroll: true });
    cible.classList.remove('est-signalee');
    /* Relancer l animation demande de laisser passer une image. */
    requestAnimationFrame(() => cible.classList.add('est-signalee'));
  }, []);

  /* DEUX LECTURES, ET ELLES NE DISENT PAS LA MEME CHOSE.
   *
   * Le total du mois est la tresorerie : ce qui part reellement ce
   * mois-ci. Une assurance annuelle pese six cents euros le mois ou
   * elle tombe et rien les onze autres — la ou, avant, elle gonflait
   * chaque mois de six cents. C est lui qui commande le solde, parce
   * que c est lui qui repond a « ai-je de quoi ce mois-ci ».
   *
   * La provision repond a une autre question — « combien mettre de
   * cote pour absorber ce qui vient » — et ne se melange donc pas au
   * total. Six cents euros annuels valent cinquante euros de
   * provision.
   */
  const moisCourant = useMemo(() => new Date(), []);
  const totalExpenses = totalDuMois(expenses, moisCourant);
  const totalIncome = totalDuMois(income, moisCourant);
  const provision = provisionMensuelle(expenses);

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

  /* La cadence part avec le reste : c est un champ de la ligne, pas
     un reglage a cote. */
  const versLaBase = (v: ValeursLigne) => ({
    name: v.name,
    amount: v.amount,
    category: v.category,
    icon_emoji: v.iconEmoji,
    icon_url: v.iconUrl,
    periode_mois: v.periodeMois ?? 1,
    mois_ancre: v.moisAncre ?? null,
    echeances: v.echeances ?? null,
    montant_total: v.montantTotal ?? null,
  });

  const handleAddExpense = async (v: ValeursLigne) => {
    if (expenses.length >= 30) { toast.error(t('finance.recurring.maxReached')); return; }
    try { await addExpense.mutateAsync(versLaBase(v)); toast.success(t('finance.recurring.expenseAdded')); }
    catch { toast.error(t('finance.recurring.addFailed')); }
  };

  const handleAddIncome = async (v: ValeursLigne) => {
    if (income.length >= 30) { toast.error(t('finance.recurring.maxReached')); return; }
    try { await addIncome.mutateAsync(versLaBase(v)); toast.success(t('finance.recurring.incomeAdded')); }
    catch { toast.error(t('finance.recurring.addFailed')); }
  };

  const handleUpdateExpense = async (id: string, v: ValeursLigne) => {
    try { await updateExpense.mutateAsync({ id, ...versLaBase(v) }); toast.success(t('finance.recurring.expenseUpdated')); }
    catch { toast.error(t('finance.recurring.updateFailed')); }
  };

  const handleUpdateIncome = async (id: string, v: ValeursLigne) => {
    try { await updateIncome.mutateAsync({ id, ...versLaBase(v) }); toast.success(t('finance.recurring.incomeUpdated')); }
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
      <MonthlyBalanceHero
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        provision={provision}
      />

      <MoisPalmares
        netPrevu={totalIncome - totalExpenses}
        restantPacte={restantPacte}
        onAllerValider={allerValider}
      />

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

      <div ref={refValidation} className="cy-cible" tabIndex={-1}>
        <MonthlyValidationPanel salaryPaymentDay={salaryPaymentDay} />
      </div>
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
