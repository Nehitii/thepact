import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Check, Edit2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO, getDate, getDaysInMonth } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  useMonthlyValidation,
  useUpsertMonthlyValidation,
  useRecurringExpenses,
  useRecurringIncome,
} from '@/hooks/useFinance';
import { toast } from 'sonner';
import { calculateActiveTotal } from '@/lib/financeCategories';
import {
  ConfirmationToggle,
  CurrencyInput,
  ValidationFlowModal,
  DeadlinePrompt,
} from './validation';

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

  const totalRecurringExpenses = calculateActiveTotal(recurringExpenses);
  const totalRecurringIncome = calculateActiveTotal(recurringIncome);

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
        {/* Header */}
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
          {/* Deadline Prompt */}
          {isNearDeadline && (
            <DeadlinePrompt 
              daysUntilDeadline={daysUntilDeadline}
              onValidate={() => setShowValidationFlow(true)}
            />
          )}

          {/* Toggle Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ConfirmationToggle
              label="Expenses Paid"
              subtext="recurring"
              currency={currency}
              amount={totalRecurringExpenses}
              isChecked={confirmedExpenses}
              onChange={setConfirmedExpenses}
              disabled={isValidated && !canEdit}
            />
            <ConfirmationToggle
              label="Income Received"
              subtext="recurring"
              currency={currency}
              amount={totalRecurringIncome}
              isChecked={confirmedIncome}
              onChange={setConfirmedIncome}
              disabled={isValidated && !canEdit}
            />
          </div>

          {/* Additional Amounts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyInput
              label="Additional Expenses"
              value={unplannedExpenses}
              onChange={setUnplannedExpenses}
              currency={currency}
              disabled={isValidated && !canEdit}
            />
            <CurrencyInput
              label="Additional Income"
              value={unplannedIncome}
              onChange={setUnplannedIncome}
              currency={currency}
              disabled={isValidated && !canEdit}
            />
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
