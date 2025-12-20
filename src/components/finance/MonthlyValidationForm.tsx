import { useState } from 'react';
import { Check, Calendar, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMonthlyValidation,
  useUpsertMonthlyValidation,
  useRecurringExpenses,
  useRecurringIncome,
} from '@/hooks/useFinance';
import { toast } from 'sonner';

interface MonthlyValidationFormProps {
  month: string; // YYYY-MM-01 format
  salaryPaymentDay: number;
}

export function MonthlyValidationForm({ month, salaryPaymentDay }: MonthlyValidationFormProps) {
  const { user } = useAuth();
  const { currency } = useCurrency();
  
  const { data: validation, isLoading } = useMonthlyValidation(user?.id, month);
  const { data: recurringExpenses = [] } = useRecurringExpenses(user?.id);
  const { data: recurringIncome = [] } = useRecurringIncome(user?.id);
  const upsertValidation = useUpsertMonthlyValidation();

  const [confirmedExpenses, setConfirmedExpenses] = useState(validation?.confirmed_expenses ?? false);
  const [confirmedIncome, setConfirmedIncome] = useState(validation?.confirmed_income ?? false);
  const [unplannedExpenses, setUnplannedExpenses] = useState(validation?.unplanned_expenses?.toString() ?? '');
  const [unplannedIncome, setUnplannedIncome] = useState(validation?.unplanned_income?.toString() ?? '');

  const totalRecurringExpenses = recurringExpenses
    .filter(e => e.is_active)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalRecurringIncome = recurringIncome
    .filter(i => i.is_active)
    .reduce((sum, i) => sum + i.amount, 0);

  const monthDate = parseISO(month);
  const monthName = format(monthDate, 'MMMM yyyy');
  const isValidated = validation?.validated_at !== null;

  const handleValidate = async () => {
    const actualExpenses = totalRecurringExpenses + (parseFloat(unplannedExpenses) || 0);
    const actualIncome = totalRecurringIncome + (parseFloat(unplannedIncome) || 0);

    try {
      await upsertValidation.mutateAsync({
        month,
        confirmed_expenses: confirmedExpenses,
        confirmed_income: confirmedIncome,
        unplanned_expenses: parseFloat(unplannedExpenses) || 0,
        unplanned_income: parseFloat(unplannedIncome) || 0,
        actual_total_income: actualIncome,
        actual_total_expenses: actualExpenses,
        validated_at: new Date().toISOString(),
      });
      toast.success(`${monthName} validated successfully`);
    } catch (e) {
      toast.error('Failed to validate month');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse bg-card/20 rounded-xl h-64" />
    );
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl opacity-50" />
      <div className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/40 rounded-xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-primary tracking-wider">
                {monthName.toUpperCase()}
              </h3>
              <p className="text-xs text-muted-foreground font-rajdhani">
                Salary day: {salaryPaymentDay}
              </p>
            </div>
          </div>
          {isValidated && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
              <Check className="h-4 w-4 text-green-400" />
              <span className="text-xs font-rajdhani text-green-400">Validated</span>
            </div>
          )}
        </div>

        {/* Confirmation Checkboxes */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Confirm Expenses */}
          <button
            onClick={() => setConfirmedExpenses(!confirmedExpenses)}
            disabled={isValidated}
            className={`p-4 rounded-lg border transition-all text-left ${
              confirmedExpenses
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-card/20 border-muted/30 hover:border-primary/30'
            } ${isValidated ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                confirmedExpenses 
                  ? 'bg-green-500/30 border-green-500' 
                  : 'border-muted-foreground'
              }`}>
                {confirmedExpenses && <Check className="h-3 w-3 text-green-400" />}
              </div>
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-sm font-rajdhani text-foreground">Expenses Paid</span>
            </div>
            <p className="text-xs text-muted-foreground font-rajdhani pl-8">
              Recurring: {formatCurrency(totalRecurringExpenses, currency)}
            </p>
          </button>

          {/* Confirm Income */}
          <button
            onClick={() => setConfirmedIncome(!confirmedIncome)}
            disabled={isValidated}
            className={`p-4 rounded-lg border transition-all text-left ${
              confirmedIncome
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-card/20 border-muted/30 hover:border-primary/30'
            } ${isValidated ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                confirmedIncome 
                  ? 'bg-green-500/30 border-green-500' 
                  : 'border-muted-foreground'
              }`}>
                {confirmedIncome && <Check className="h-3 w-3 text-green-400" />}
              </div>
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm font-rajdhani text-foreground">Income Received</span>
            </div>
            <p className="text-xs text-muted-foreground font-rajdhani pl-8">
              Recurring: {formatCurrency(totalRecurringIncome, currency)}
            </p>
          </button>
        </div>

        {/* Unplanned Amounts */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Unplanned Expenses */}
          <div>
            <label className="block text-xs font-rajdhani text-muted-foreground uppercase tracking-wider mb-2">
              Additional Expenses
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={unplannedExpenses}
                onChange={(e) => setUnplannedExpenses(e.target.value)}
                disabled={isValidated}
                className="pl-7 bg-card/50 border-red-500/20 focus:border-red-500/50"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-xs text-muted-foreground font-rajdhani mt-1">
              Unexpected costs this month
            </p>
          </div>

          {/* Unplanned Income */}
          <div>
            <label className="block text-xs font-rajdhani text-muted-foreground uppercase tracking-wider mb-2">
              Additional Income
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={unplannedIncome}
                onChange={(e) => setUnplannedIncome(e.target.value)}
                disabled={isValidated}
                className="pl-7 bg-card/50 border-green-500/20 focus:border-green-500/50"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-xs text-muted-foreground font-rajdhani mt-1">
              Bonus, gifts, side income
            </p>
          </div>
        </div>

        {/* Validate Button */}
        {!isValidated && (
          <Button
            onClick={handleValidate}
            disabled={!confirmedExpenses || !confirmedIncome || upsertValidation.isPending}
            className="w-full"
          >
            {upsertValidation.isPending ? 'Validating...' : 'Validate This Month'}
          </Button>
        )}

        {/* Tip */}
        {!isValidated && (!confirmedExpenses || !confirmedIncome) && (
          <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-primary/80 font-rajdhani">
              Confirm both your recurring expenses and income before validating this month.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
