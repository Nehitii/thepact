import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Check, Edit2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { format, parseISO, getDate, getDaysInMonth } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMonthlyValidation,
  useUpsertMonthlyValidation,
  useRecurringExpenses,
  useRecurringIncome,
} from '@/hooks/useFinance';
import { toast } from 'sonner';

interface MonthlyValidationPanelProps {
  salaryPaymentDay: number;
}

export function MonthlyValidationPanel({ salaryPaymentDay }: MonthlyValidationPanelProps) {
  const { user } = useAuth();
  const { currency } = useCurrency();
  
  const currentMonth = format(new Date(), 'yyyy-MM-01');
  const { data: currentValidation, isLoading } = useMonthlyValidation(user?.id, currentMonth);
  const { data: recurringExpenses = [] } = useRecurringExpenses(user?.id);
  const { data: recurringIncome = [] } = useRecurringIncome(user?.id);
  const upsertValidation = useUpsertMonthlyValidation();

  const [confirmedExpenses, setConfirmedExpenses] = useState(false);
  const [confirmedIncome, setConfirmedIncome] = useState(false);
  const [unplannedExpenses, setUnplannedExpenses] = useState('');
  const [unplannedIncome, setUnplannedIncome] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showValidationFlow, setShowValidationFlow] = useState(false);

  useEffect(() => {
    if (currentValidation) {
      setConfirmedExpenses(currentValidation.confirmed_expenses);
      setConfirmedIncome(currentValidation.confirmed_income);
      setUnplannedExpenses(currentValidation.unplanned_expenses?.toString() || '');
      setUnplannedIncome(currentValidation.unplanned_income?.toString() || '');
    }
  }, [currentValidation]);

  const totalRecurringExpenses = recurringExpenses
    .filter(e => e.is_active)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalRecurringIncome = recurringIncome
    .filter(i => i.is_active)
    .reduce((sum, i) => sum + i.amount, 0);

  const isValidated = currentValidation?.validated_at !== null;
  const canEdit = isValidated && isEditing;

  // Check if near deadline (within 7 days of salary day)
  const today = getDate(new Date());
  const daysInMonth = getDaysInMonth(new Date());
  const daysUntilDeadline = salaryPaymentDay >= today 
    ? salaryPaymentDay - today 
    : daysInMonth - today + salaryPaymentDay;
  const isNearDeadline = daysUntilDeadline <= 7 && !isValidated;

  const handleValidate = async () => {
    const actualExpenses = totalRecurringExpenses + (parseFloat(unplannedExpenses) || 0);
    const actualIncome = totalRecurringIncome + (parseFloat(unplannedIncome) || 0);

    try {
      await upsertValidation.mutateAsync({
        month: currentMonth,
        confirmed_expenses: confirmedExpenses,
        confirmed_income: confirmedIncome,
        unplanned_expenses: parseFloat(unplannedExpenses) || 0,
        unplanned_income: parseFloat(unplannedIncome) || 0,
        actual_total_income: actualIncome,
        actual_total_expenses: actualExpenses,
        validated_at: new Date().toISOString(),
      });
      toast.success('Month validated successfully');
      setIsEditing(false);
      setShowValidationFlow(false);
    } catch (e) {
      toast.error('Failed to validate month');
    }
  };

  const handleUpdate = async () => {
    const actualExpenses = totalRecurringExpenses + (parseFloat(unplannedExpenses) || 0);
    const actualIncome = totalRecurringIncome + (parseFloat(unplannedIncome) || 0);

    try {
      await upsertValidation.mutateAsync({
        month: currentMonth,
        confirmed_expenses: confirmedExpenses,
        confirmed_income: confirmedIncome,
        unplanned_expenses: parseFloat(unplannedExpenses) || 0,
        unplanned_income: parseFloat(unplannedIncome) || 0,
        actual_total_income: actualIncome,
        actual_total_expenses: actualExpenses,
        validated_at: currentValidation?.validated_at || new Date().toISOString(),
      });
      toast.success('Month updated successfully');
      setIsEditing(false);
    } catch (e) {
      toast.error('Failed to update month');
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/70 to-slate-800/30 border border-white/[0.06] p-8 flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-4"
    >
      {/* Current Month Status Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/30 border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-white/[0.04]">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {format(parseISO(currentMonth), 'MMMM yyyy')}
              </h3>
              <p className="text-sm text-slate-500">
                Salary day: {salaryPaymentDay}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isValidated && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-slate-400 hover:text-white hover:bg-white/[0.04]"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {isValidated && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Validated</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Validation Action - Prominent when near deadline */}
          {isNearDeadline && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 border border-primary/30"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(56,189,248,0.15),transparent_70%)]" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Time to validate!</p>
                    <p className="text-sm text-slate-400">{daysUntilDeadline} days until salary day</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowValidationFlow(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6"
                >
                  Validate Month
                </Button>
              </div>
            </motion.div>
          )}

          {/* Confirmation Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Confirm Expenses */}
            <button
              onClick={() => !isValidated || canEdit ? setConfirmedExpenses(!confirmedExpenses) : null}
              disabled={isValidated && !canEdit}
              className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                confirmedExpenses
                  ? 'bg-emerald-500/[0.08] border-emerald-500/20'
                  : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]'
              } ${isValidated && !canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  confirmedExpenses 
                    ? 'bg-emerald-500/20 border-emerald-500' 
                    : 'border-slate-500'
                }`}>
                  {confirmedExpenses && <Check className="h-3 w-3 text-emerald-400" />}
                </div>
                <span className="text-sm font-medium text-white">Expenses Paid</span>
              </div>
              <p className="text-sm text-slate-400 pl-8">
                {formatCurrency(totalRecurringExpenses, currency)} recurring
              </p>
            </button>

            {/* Confirm Income */}
            <button
              onClick={() => !isValidated || canEdit ? setConfirmedIncome(!confirmedIncome) : null}
              disabled={isValidated && !canEdit}
              className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                confirmedIncome
                  ? 'bg-emerald-500/[0.08] border-emerald-500/20'
                  : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]'
              } ${isValidated && !canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  confirmedIncome 
                    ? 'bg-emerald-500/20 border-emerald-500' 
                    : 'border-slate-500'
                }`}>
                  {confirmedIncome && <Check className="h-3 w-3 text-emerald-400" />}
                </div>
                <span className="text-sm font-medium text-white">Income Received</span>
              </div>
              <p className="text-sm text-slate-400 pl-8">
                {formatCurrency(totalRecurringIncome, currency)} recurring
              </p>
            </button>
          </div>

          {/* Additional Amounts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Additional Expenses */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400 font-medium">Additional Expenses</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  {getCurrencySymbol(currency)}
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={unplannedExpenses}
                  onChange={(e) => setUnplannedExpenses(e.target.value.replace(/[^0-9.]/g, ''))}
                  disabled={isValidated && !canEdit}
                  className="pl-7 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-white/20"
                />
              </div>
            </div>

            {/* Additional Income */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400 font-medium">Additional Income</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  {getCurrencySymbol(currency)}
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={unplannedIncome}
                  onChange={(e) => setUnplannedIncome(e.target.value.replace(/[^0-9.]/g, ''))}
                  disabled={isValidated && !canEdit}
                  className="pl-7 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-white/20"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isValidated && !isNearDeadline && (
            <Button
              onClick={handleValidate}
              disabled={!confirmedExpenses || !confirmedIncome || upsertValidation.isPending}
              className="w-full h-11 text-sm font-medium"
            >
              {upsertValidation.isPending ? 'Validating...' : 'Validate This Month'}
            </Button>
          )}
          
          {canEdit && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex-1 h-11 border-white/[0.1] text-slate-300 hover:bg-white/[0.04] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={upsertValidation.isPending}
                className="flex-1 h-11"
              >
                {upsertValidation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}

          {/* Tip */}
          {!isValidated && (!confirmedExpenses || !confirmedIncome) && !isNearDeadline && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <AlertCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                Confirm both your recurring expenses and income before validating.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Validation Flow Modal */}
      <AnimatePresence>
        {showValidationFlow && (
          <ValidationFlowModal
            onClose={() => setShowValidationFlow(false)}
            onValidate={handleValidate}
            isPending={upsertValidation.isPending}
            recurringExpenses={recurringExpenses}
            recurringIncome={recurringIncome}
            confirmedExpenses={confirmedExpenses}
            confirmedIncome={confirmedIncome}
            setConfirmedExpenses={setConfirmedExpenses}
            setConfirmedIncome={setConfirmedIncome}
            unplannedExpenses={unplannedExpenses}
            unplannedIncome={unplannedIncome}
            setUnplannedExpenses={setUnplannedExpenses}
            setUnplannedIncome={setUnplannedIncome}
            currency={currency}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Validation Flow Modal Component
interface ValidationFlowModalProps {
  onClose: () => void;
  onValidate: () => Promise<void>;
  isPending: boolean;
  recurringExpenses: Array<{ id: string; name: string; amount: number; is_active: boolean }>;
  recurringIncome: Array<{ id: string; name: string; amount: number; is_active: boolean }>;
  confirmedExpenses: boolean;
  confirmedIncome: boolean;
  setConfirmedExpenses: (v: boolean) => void;
  setConfirmedIncome: (v: boolean) => void;
  unplannedExpenses: string;
  unplannedIncome: string;
  setUnplannedExpenses: (v: string) => void;
  setUnplannedIncome: (v: string) => void;
  currency: string;
}

function ValidationFlowModal({
  onClose,
  onValidate,
  isPending,
  recurringExpenses,
  recurringIncome,
  confirmedExpenses,
  confirmedIncome,
  setConfirmedExpenses,
  setConfirmedIncome,
  unplannedExpenses,
  unplannedIncome,
  setUnplannedExpenses,
  setUnplannedIncome,
  currency,
}: ValidationFlowModalProps) {
  const [step, setStep] = useState<'expenses' | 'income' | 'extras' | 'confirm'>('expenses');

  const totalExpenses = recurringExpenses.filter(e => e.is_active).reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = recurringIncome.filter(i => i.is_active).reduce((sum, i) => sum + i.amount, 0);

  const handleNext = () => {
    if (step === 'expenses') setStep('income');
    else if (step === 'income') setStep('extras');
    else if (step === 'extras') setStep('confirm');
  };

  const handleBack = () => {
    if (step === 'income') setStep('expenses');
    else if (step === 'extras') setStep('income');
    else if (step === 'confirm') setStep('extras');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800/90 border border-white/[0.08] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">Monthly Validation</h2>
          <div className="flex gap-1 mt-3">
            {['expenses', 'income', 'extras', 'confirm'].map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  ['expenses', 'income', 'extras', 'confirm'].indexOf(step) >= i
                    ? 'bg-primary'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 min-h-[300px]">
          <AnimatePresence mode="wait">
            {step === 'expenses' && (
              <motion.div
                key="expenses"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-base font-medium text-white">Review Recurring Expenses</h3>
                <p className="text-sm text-slate-400">Confirm all expenses were paid as expected.</p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {recurringExpenses.filter(e => e.is_active).map((expense) => (
                    <div key={expense.id} className="flex justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-sm text-white">{expense.name}</span>
                      <span className="text-sm text-rose-400">{formatCurrency(expense.amount, currency)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-sm text-slate-400">Total:</span>
                  <span className="text-lg font-semibold text-rose-400">{formatCurrency(totalExpenses, currency)}</span>
                </div>
                <button
                  onClick={() => setConfirmedExpenses(!confirmedExpenses)}
                  className={`w-full p-4 rounded-xl border transition-all ${
                    confirmedExpenses
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                      confirmedExpenses ? 'bg-emerald-500/20 border-emerald-500' : 'border-slate-500'
                    }`}>
                      {confirmedExpenses && <Check className="h-3 w-3 text-emerald-400" />}
                    </div>
                    <span className="text-sm font-medium text-white">All expenses paid correctly</span>
                  </div>
                </button>
              </motion.div>
            )}

            {step === 'income' && (
              <motion.div
                key="income"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-base font-medium text-white">Review Recurring Income</h3>
                <p className="text-sm text-slate-400">Confirm all income was received as expected.</p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {recurringIncome.filter(i => i.is_active).map((income) => (
                    <div key={income.id} className="flex justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-sm text-white">{income.name}</span>
                      <span className="text-sm text-emerald-400">{formatCurrency(income.amount, currency)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-sm text-slate-400">Total:</span>
                  <span className="text-lg font-semibold text-emerald-400">{formatCurrency(totalIncome, currency)}</span>
                </div>
                <button
                  onClick={() => setConfirmedIncome(!confirmedIncome)}
                  className={`w-full p-4 rounded-xl border transition-all ${
                    confirmedIncome
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                      confirmedIncome ? 'bg-emerald-500/20 border-emerald-500' : 'border-slate-500'
                    }`}>
                      {confirmedIncome && <Check className="h-3 w-3 text-emerald-400" />}
                    </div>
                    <span className="text-sm font-medium text-white">All income received correctly</span>
                  </div>
                </button>
              </motion.div>
            )}

            {step === 'extras' && (
              <motion.div
                key="extras"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-base font-medium text-white mb-1">Additional Transactions</h3>
                  <p className="text-sm text-slate-400">Add any unexpected expenses or income.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">Extra Expenses</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        {getCurrencySymbol(currency)}
                      </span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={unplannedExpenses}
                        onChange={(e) => setUnplannedExpenses(e.target.value.replace(/[^0-9.]/g, ''))}
                        className="pl-7 bg-white/[0.03] border-white/[0.08] text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">Extra Income</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        {getCurrencySymbol(currency)}
                      </span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={unplannedIncome}
                        onChange={(e) => setUnplannedIncome(e.target.value.replace(/[^0-9.]/g, ''))}
                        className="pl-7 bg-white/[0.03] border-white/[0.08] text-white"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Ready to Validate</h3>
                  <p className="text-sm text-slate-400">Review your monthly summary before confirming.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-400/80 mb-1">Total Income</p>
                    <p className="text-xl font-semibold text-emerald-400">
                      {formatCurrency(totalIncome + (parseFloat(unplannedIncome) || 0), currency)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <p className="text-xs text-rose-400/80 mb-1">Total Expenses</p>
                    <p className="text-xl font-semibold text-rose-400">
                      {formatCurrency(totalExpenses + (parseFloat(unplannedExpenses) || 0), currency)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/[0.06] flex gap-3">
          {step !== 'expenses' && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 border-white/[0.1] text-slate-300 hover:bg-white/[0.04]"
            >
              Back
            </Button>
          )}
          {step === 'expenses' && (
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/[0.1] text-slate-300 hover:bg-white/[0.04]"
            >
              Cancel
            </Button>
          )}
          {step !== 'confirm' ? (
            <Button
              onClick={handleNext}
              disabled={
                (step === 'expenses' && !confirmedExpenses) ||
                (step === 'income' && !confirmedIncome)
              }
              className="flex-1"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={onValidate}
              disabled={isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500"
            >
              {isPending ? 'Validating...' : 'Confirm & Validate'}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
