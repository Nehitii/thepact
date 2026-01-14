import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Check, Edit2, AlertCircle, Sparkles, X, ArrowRight, PartyPopper } from 'lucide-react';
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
      <div className="neu-card p-8 flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-4"
    >
      {/* Current Month Status Card */}
      <div className={`neu-card overflow-hidden ${isValidated ? 'validation-complete' : isNearDeadline ? 'validation-pending' : ''}`}>
        <div className="p-6 flex items-center justify-between border-b border-white/[0.04]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center shadow-[0_0_30px_hsla(200,100%,60%,0.15)]">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
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
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 shadow-[0_0_20px_hsla(160,80%,50%,0.15)]"
              >
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Validated</span>
              </motion.div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Validation Action - Prominent when near deadline */}
          {isNearDeadline && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, hsla(200,100%,60%,0.15) 0%, hsla(200,100%,50%,0.05) 100%)',
                border: '1px solid hsla(200,100%,60%,0.3)',
                boxShadow: '0 0 40px hsla(200,100%,60%,0.15)',
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsla(200,100%,60%,0.2),transparent_70%)]" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-6 h-6 text-primary" />
                    </motion.div>
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">Time to validate!</p>
                    <p className="text-sm text-slate-400">{daysUntilDeadline} days until salary day</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowValidationFlow(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 h-auto shadow-[0_0_30px_hsla(200,100%,60%,0.3)]"
                >
                  Validate Month
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Toggle Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Confirm Expenses */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => !isValidated || canEdit ? setConfirmedExpenses(!confirmedExpenses) : null}
              disabled={isValidated && !canEdit}
              className={`neu-toggle p-5 rounded-2xl border transition-all duration-300 text-left ${
                confirmedExpenses
                  ? 'active border-emerald-500/30'
                  : 'border-white/[0.05]'
              } ${isValidated && !canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                  confirmedExpenses 
                    ? 'bg-emerald-500/30 border-emerald-500 shadow-[0_0_15px_hsla(160,80%,50%,0.4)]' 
                    : 'border-slate-500'
                }`}>
                  {confirmedExpenses && <Check className="h-4 w-4 text-emerald-400" />}
                </div>
                <span className="text-base font-semibold text-white">Expenses Paid</span>
              </div>
              <p className="text-sm text-slate-400 pl-10">
                {formatCurrency(totalRecurringExpenses, currency)} recurring
              </p>
            </motion.button>

            {/* Confirm Income */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => !isValidated || canEdit ? setConfirmedIncome(!confirmedIncome) : null}
              disabled={isValidated && !canEdit}
              className={`neu-toggle p-5 rounded-2xl border transition-all duration-300 text-left ${
                confirmedIncome
                  ? 'active border-emerald-500/30'
                  : 'border-white/[0.05]'
              } ${isValidated && !canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                  confirmedIncome 
                    ? 'bg-emerald-500/30 border-emerald-500 shadow-[0_0_15px_hsla(160,80%,50%,0.4)]' 
                    : 'border-slate-500'
                }`}>
                  {confirmedIncome && <Check className="h-4 w-4 text-emerald-400" />}
                </div>
                <span className="text-base font-semibold text-white">Income Received</span>
              </div>
              <p className="text-sm text-slate-400 pl-10">
                {formatCurrency(totalRecurringIncome, currency)} recurring
              </p>
            </motion.button>
          </div>

          {/* Additional Amounts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400 font-medium">Additional Expenses</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  {getCurrencySymbol(currency)}
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={unplannedExpenses}
                  onChange={(e) => setUnplannedExpenses(e.target.value.replace(/[^0-9.]/g, ''))}
                  disabled={isValidated && !canEdit}
                  className="pl-8 h-12 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400 font-medium">Additional Income</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  {getCurrencySymbol(currency)}
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={unplannedIncome}
                  onChange={(e) => setUnplannedIncome(e.target.value.replace(/[^0-9.]/g, ''))}
                  disabled={isValidated && !canEdit}
                  className="pl-8 h-12 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isValidated && !isNearDeadline && (
            <Button
              onClick={handleValidate}
              disabled={!confirmedExpenses || !confirmedIncome || upsertValidation.isPending}
              className="w-full h-12 text-sm font-semibold rounded-xl"
            >
              {upsertValidation.isPending ? 'Validating...' : 'Validate This Month'}
            </Button>
          )}
          
          {canEdit && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex-1 h-12 border-white/[0.1] text-slate-300 hover:bg-white/[0.04] hover:text-white rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={upsertValidation.isPending}
                className="flex-1 h-12 rounded-xl"
              >
                {upsertValidation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}

          {/* Tip */}
          {!isValidated && (!confirmedExpenses || !confirmedIncome) && !isNearDeadline && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-xl neu-inset"
            >
              <AlertCircle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-400">
                Confirm both your recurring expenses and income before validating.
              </p>
            </motion.div>
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

  const steps = ['expenses', 'income', 'extras', 'confirm'] as const;
  const currentStepIndex = steps.indexOf(step);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg glass-modal rounded-3xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Monthly Validation</h2>
            <p className="text-sm text-slate-500 mt-1">Step {currentStepIndex + 1} of {steps.length}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <motion.div
                key={s}
                className="h-1.5 flex-1 rounded-full overflow-hidden bg-white/[0.05]"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: currentStepIndex >= i ? '100%' : '0%' }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                  style={{ boxShadow: '0 0 10px hsla(200,100%,60%,0.5)' }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[320px]">
          <AnimatePresence mode="wait">
            {step === 'expenses' && (
              <motion.div
                key="expenses"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">Review Recurring Expenses</h3>
                  <p className="text-sm text-slate-400 mt-1">Confirm all expenses were paid as expected.</p>
                </div>
                <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin">
                  {recurringExpenses.filter(e => e.is_active).map((expense) => (
                    <motion.div 
                      key={expense.id} 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-between p-4 rounded-xl neu-inset"
                    >
                      <span className="text-sm text-white">{expense.name}</span>
                      <span className="text-sm font-semibold text-rose-400">{formatCurrency(expense.amount, currency)}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-sm text-slate-400">Total:</span>
                  <span className="text-xl font-bold text-rose-400">{formatCurrency(totalExpenses, currency)}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setConfirmedExpenses(!confirmedExpenses)}
                  className={`w-full p-5 rounded-2xl neu-toggle border transition-all ${
                    confirmedExpenses
                      ? 'active border-emerald-500/30'
                      : 'border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      confirmedExpenses ? 'bg-emerald-500/30 border-emerald-500' : 'border-slate-500'
                    }`}>
                      {confirmedExpenses && <Check className="h-4 w-4 text-emerald-400" />}
                    </div>
                    <span className="text-sm font-medium text-white">All expenses paid correctly</span>
                  </div>
                </motion.button>
              </motion.div>
            )}

            {step === 'income' && (
              <motion.div
                key="income"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">Review Recurring Income</h3>
                  <p className="text-sm text-slate-400 mt-1">Confirm all income was received as expected.</p>
                </div>
                <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin">
                  {recurringIncome.filter(i => i.is_active).map((income) => (
                    <motion.div 
                      key={income.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-between p-4 rounded-xl neu-inset"
                    >
                      <span className="text-sm text-white">{income.name}</span>
                      <span className="text-sm font-semibold text-emerald-400">{formatCurrency(income.amount, currency)}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-sm text-slate-400">Total:</span>
                  <span className="text-xl font-bold text-emerald-400">{formatCurrency(totalIncome, currency)}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setConfirmedIncome(!confirmedIncome)}
                  className={`w-full p-5 rounded-2xl neu-toggle border transition-all ${
                    confirmedIncome
                      ? 'active border-emerald-500/30'
                      : 'border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      confirmedIncome ? 'bg-emerald-500/30 border-emerald-500' : 'border-slate-500'
                    }`}>
                      {confirmedIncome && <Check className="h-4 w-4 text-emerald-400" />}
                    </div>
                    <span className="text-sm font-medium text-white">All income received correctly</span>
                  </div>
                </motion.button>
              </motion.div>
            )}

            {step === 'extras' && (
              <motion.div
                key="extras"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">Additional Transactions</h3>
                  <p className="text-sm text-slate-400 mt-1">Add any unexpected expenses or income.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400 font-medium">Extra Expenses</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        {getCurrencySymbol(currency)}
                      </span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={unplannedExpenses}
                        onChange={(e) => setUnplannedExpenses(e.target.value.replace(/[^0-9.]/g, ''))}
                        className="pl-8 h-12 bg-white/[0.03] border-white/[0.08] text-white rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400 font-medium">Extra Income</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        {getCurrencySymbol(currency)}
                      </span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={unplannedIncome}
                        onChange={(e) => setUnplannedIncome(e.target.value.replace(/[^0-9.]/g, ''))}
                        className="pl-8 h-12 bg-white/[0.03] border-white/[0.08] text-white rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_40px_hsla(200,100%,60%,0.3)]"
                  >
                    <PartyPopper className="w-10 h-10 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">Ready to Validate</h3>
                  <p className="text-sm text-slate-400">Review your monthly summary before confirming.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25"
                  >
                    <p className="text-xs text-emerald-400/80 mb-2 uppercase tracking-wider font-medium">Total Income</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {formatCurrency(totalIncome + (parseFloat(unplannedIncome) || 0), currency)}
                    </p>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/25"
                  >
                    <p className="text-xs text-rose-400/80 mb-2 uppercase tracking-wider font-medium">Total Expenses</p>
                    <p className="text-2xl font-bold text-rose-400">
                      {formatCurrency(totalExpenses + (parseFloat(unplannedExpenses) || 0), currency)}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/[0.06] flex gap-3">
          {step !== 'expenses' && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-12 border-white/[0.1] text-slate-300 hover:bg-white/[0.04] rounded-xl"
            >
              Back
            </Button>
          )}
          {step === 'expenses' && (
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 border-white/[0.1] text-slate-300 hover:bg-white/[0.04] rounded-xl"
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
              className="flex-1 h-12 rounded-xl"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={onValidate}
              disabled={isPending}
              className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-[0_0_30px_hsla(160,80%,50%,0.3)]"
            >
              {isPending ? 'Validating...' : 'Confirm & Validate'}
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}