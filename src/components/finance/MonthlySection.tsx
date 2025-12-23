import { useState, useMemo } from 'react';
import { Check, Calendar, ChevronDown, ChevronRight, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { format, parseISO, subMonths, startOfMonth } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMonthlyValidations,
  useMonthlyValidation,
  useUpsertMonthlyValidation,
  useRecurringExpenses,
  useRecurringIncome,
} from '@/hooks/useFinance';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MonthlySectionProps {
  salaryPaymentDay: number;
}

export function MonthlySection({ salaryPaymentDay }: MonthlySectionProps) {
  const { user } = useAuth();
  const { currency } = useCurrency();
  
  const currentMonth = format(new Date(), 'yyyy-MM-01');
  const { data: allValidations = [] } = useMonthlyValidations(user?.id);
  const { data: currentValidation, isLoading } = useMonthlyValidation(user?.id, currentMonth);
  const { data: recurringExpenses = [] } = useRecurringExpenses(user?.id);
  const { data: recurringIncome = [] } = useRecurringIncome(user?.id);
  const upsertValidation = useUpsertMonthlyValidation();

  const [confirmedExpenses, setConfirmedExpenses] = useState(false);
  const [confirmedIncome, setConfirmedIncome] = useState(false);
  const [unplannedExpenses, setUnplannedExpenses] = useState('');
  const [unplannedIncome, setUnplannedIncome] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

  // Initialize from validation data
  useState(() => {
    if (currentValidation) {
      setConfirmedExpenses(currentValidation.confirmed_expenses);
      setConfirmedIncome(currentValidation.confirmed_income);
      setUnplannedExpenses(currentValidation.unplanned_expenses?.toString() || '');
      setUnplannedIncome(currentValidation.unplanned_income?.toString() || '');
    }
  });

  const totalRecurringExpenses = recurringExpenses
    .filter(e => e.is_active)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalRecurringIncome = recurringIncome
    .filter(i => i.is_active)
    .reduce((sum, i) => sum + i.amount, 0);

  const isValidated = currentValidation?.validated_at !== null;
  const canEdit = isValidated && isEditing;

  // Generate past 12 months
  const pastMonths = useMemo(() => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      const monthDate = subMonths(startOfMonth(new Date()), i);
      const monthKey = format(monthDate, 'yyyy-MM-01');
      const validation = allValidations.find(v => v.month === monthKey);
      months.push({
        key: monthKey,
        label: format(monthDate, 'MMMM yyyy'),
        validation,
      });
    }
    return months;
  }, [allValidations]);

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

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => 
      prev.includes(monthKey) 
        ? prev.filter(m => m !== monthKey)
        : [...prev, monthKey]
    );
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-8">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Month Card */}
      <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {format(parseISO(currentMonth), 'MMMM yyyy')}
              </h3>
              <p className="text-xs text-muted-foreground">
                Salary day: {salaryPaymentDay}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isValidated && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            )}
            {isValidated && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Validated</span>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Confirm Expenses */}
          <button
            onClick={() => !isValidated || canEdit ? setConfirmedExpenses(!confirmedExpenses) : null}
            disabled={isValidated && !canEdit}
            className={`p-4 rounded-xl border transition-all duration-200 text-left ${
              confirmedExpenses
                ? 'bg-emerald-500/[0.05] border-emerald-500/[0.15]'
                : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
            } ${isValidated && !canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                confirmedExpenses 
                  ? 'bg-emerald-500/20 border-emerald-500' 
                  : 'border-muted-foreground/50'
              }`}>
                {confirmedExpenses && <Check className="h-3 w-3 text-emerald-400" />}
              </div>
              <TrendingDown className="h-4 w-4 text-rose-400" />
              <span className="text-sm font-medium text-foreground">Expenses Paid</span>
            </div>
            <p className="text-xs text-muted-foreground pl-8">
              {formatCurrency(totalRecurringExpenses, currency)} recurring
            </p>
          </button>

          {/* Confirm Income */}
          <button
            onClick={() => !isValidated || canEdit ? setConfirmedIncome(!confirmedIncome) : null}
            disabled={isValidated && !canEdit}
            className={`p-4 rounded-xl border transition-all duration-200 text-left ${
              confirmedIncome
                ? 'bg-emerald-500/[0.05] border-emerald-500/[0.15]'
                : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
            } ${isValidated && !canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                confirmedIncome 
                  ? 'bg-emerald-500/20 border-emerald-500' 
                  : 'border-muted-foreground/50'
              }`}>
                {confirmedIncome && <Check className="h-3 w-3 text-emerald-400" />}
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-foreground">Income Received</span>
            </div>
            <p className="text-xs text-muted-foreground pl-8">
              {formatCurrency(totalRecurringIncome, currency)} recurring
            </p>
          </button>
        </div>

        {/* Additional Amounts */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
              Additional Expenses
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                type="number"
                placeholder="0"
                value={unplannedExpenses}
                onChange={(e) => setUnplannedExpenses(e.target.value)}
                disabled={isValidated && !canEdit}
                className="pl-7 bg-white/[0.02] border-white/[0.08] focus:border-rose-500/30 h-11"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
              Additional Income
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                type="number"
                placeholder="0"
                value={unplannedIncome}
                onChange={(e) => setUnplannedIncome(e.target.value)}
                disabled={isValidated && !canEdit}
                className="pl-7 bg-white/[0.02] border-white/[0.08] focus:border-emerald-500/30 h-11"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isValidated && (
          <Button
            onClick={handleValidate}
            disabled={!confirmedExpenses || !confirmedIncome || upsertValidation.isPending}
            className="w-full h-11"
          >
            {upsertValidation.isPending ? 'Validating...' : 'Validate This Month'}
          </Button>
        )}
        
        {canEdit && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="flex-1 h-11 border-white/[0.08]"
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
      </div>

      {/* Past Months Archive */}
      <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Monthly History</h3>
        
        <div className="space-y-2">
          {pastMonths.map((month) => (
            <Collapsible
              key={month.key}
              open={expandedMonths.includes(month.key)}
              onOpenChange={() => toggleMonth(month.key)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all">
                  <div className="flex items-center gap-3">
                    {expandedMonths.includes(month.key) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground">{month.label}</span>
                  </div>
                  {month.validation?.validated_at ? (
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs text-emerald-400">Validated</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not validated</span>
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                  {month.validation ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Income</p>
                        <p className="font-semibold text-emerald-400 tabular-nums">
                          {formatCurrency(month.validation.actual_total_income || 0, currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
                        <p className="font-semibold text-rose-400 tabular-nums">
                          {formatCurrency(month.validation.actual_total_expenses || 0, currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Net Balance</p>
                        <p className={`font-semibold tabular-nums ${
                          (month.validation.actual_total_income || 0) - (month.validation.actual_total_expenses || 0) >= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}>
                          {formatCurrency(
                            (month.validation.actual_total_income || 0) - (month.validation.actual_total_expenses || 0),
                            currency
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Unplanned</p>
                        <p className="text-foreground tabular-nums">
                          +{formatCurrency(month.validation.unplanned_income || 0, currency)} / -{formatCurrency(month.validation.unplanned_expenses || 0, currency)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No data recorded for this month
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  );
}