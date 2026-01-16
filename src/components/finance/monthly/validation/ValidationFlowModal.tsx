import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { Input } from '@/components/ui/input';

interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  is_active: boolean;
}

interface ValidationFlowModalProps {
  onClose: () => void;
  onValidate: () => Promise<void>;
  isPending: boolean;
  recurringExpenses: RecurringItem[];
  recurringIncome: RecurringItem[];
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

type Step = 'expenses' | 'income' | 'extras' | 'confirm';

export function ValidationFlowModal({
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
  const [step, setStep] = useState<Step>('expenses');

  const totalExpenses = recurringExpenses.filter(e => e.is_active).reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = recurringIncome.filter(i => i.is_active).reduce((sum, i) => sum + i.amount, 0);

  const steps: Step[] = ['expenses', 'income', 'extras', 'confirm'];
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
              <StepExpenses 
                recurringExpenses={recurringExpenses}
                totalExpenses={totalExpenses}
                confirmedExpenses={confirmedExpenses}
                setConfirmedExpenses={setConfirmedExpenses}
                currency={currency}
              />
            )}

            {step === 'income' && (
              <StepIncome 
                recurringIncome={recurringIncome}
                totalIncome={totalIncome}
                confirmedIncome={confirmedIncome}
                setConfirmedIncome={setConfirmedIncome}
                currency={currency}
              />
            )}

            {step === 'extras' && (
              <StepExtras 
                unplannedExpenses={unplannedExpenses}
                unplannedIncome={unplannedIncome}
                setUnplannedExpenses={setUnplannedExpenses}
                setUnplannedIncome={setUnplannedIncome}
                currency={currency}
              />
            )}

            {step === 'confirm' && (
              <StepConfirm 
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                unplannedIncome={unplannedIncome}
                unplannedExpenses={unplannedExpenses}
                currency={currency}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/[0.06] flex gap-3">
          {step !== 'expenses' ? (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-12 border-white/[0.1] text-slate-300 hover:bg-white/[0.04] rounded-xl"
            >
              Back
            </Button>
          ) : (
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

// Step Components
interface StepExpensesProps {
  recurringExpenses: RecurringItem[];
  totalExpenses: number;
  confirmedExpenses: boolean;
  setConfirmedExpenses: (v: boolean) => void;
  currency: string;
}

function StepExpenses({ recurringExpenses, totalExpenses, confirmedExpenses, setConfirmedExpenses, currency }: StepExpensesProps) {
  return (
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
          confirmedExpenses ? 'active border-emerald-500/30' : 'border-white/[0.06]'
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
  );
}

interface StepIncomeProps {
  recurringIncome: RecurringItem[];
  totalIncome: number;
  confirmedIncome: boolean;
  setConfirmedIncome: (v: boolean) => void;
  currency: string;
}

function StepIncome({ recurringIncome, totalIncome, confirmedIncome, setConfirmedIncome, currency }: StepIncomeProps) {
  return (
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
          confirmedIncome ? 'active border-emerald-500/30' : 'border-white/[0.06]'
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
  );
}

interface StepExtrasProps {
  unplannedExpenses: string;
  unplannedIncome: string;
  setUnplannedExpenses: (v: string) => void;
  setUnplannedIncome: (v: string) => void;
  currency: string;
}

function StepExtras({ unplannedExpenses, unplannedIncome, setUnplannedExpenses, setUnplannedIncome, currency }: StepExtrasProps) {
  return (
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
  );
}

interface StepConfirmProps {
  totalIncome: number;
  totalExpenses: number;
  unplannedIncome: string;
  unplannedExpenses: string;
  currency: string;
}

function StepConfirm({ totalIncome, totalExpenses, unplannedIncome, unplannedExpenses, currency }: StepConfirmProps) {
  return (
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
  );
}
