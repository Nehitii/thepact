import { useState, useMemo, useEffect } from 'react';
import { Check, Calendar, ChevronDown, ChevronRight, Edit2, TrendingUp, TrendingDown, 
  Home, Car, Utensils, Wifi, Heart, ShoppingBag, Zap, DollarSign, Briefcase, Gift, 
  Plane, Landmark, PiggyBank, GraduationCap, Gamepad2, Wrench, CreditCard, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

// Expense categories with icons and colors
const EXPENSE_CATEGORIES = [
  { value: 'housing', label: 'Housing / Rent', icon: Home, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { value: 'utilities', label: 'Utilities', icon: Wifi, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { value: 'food', label: 'Food', icon: Utensils, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { value: 'transport', label: 'Transport', icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { value: 'subscriptions', label: 'Subscriptions', icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { value: 'health', label: 'Health', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { value: 'leisure', label: 'Leisure', icon: Gamepad2, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { value: 'savings', label: 'Savings', icon: PiggyBank, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { value: 'investments', label: 'Investments', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
  { value: 'taxes', label: 'Taxes', icon: Landmark, color: 'text-red-400', bg: 'bg-red-500/10' },
  { value: 'education', label: 'Education', icon: GraduationCap, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { value: 'travel', label: 'Travel', icon: Plane, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { value: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { value: 'miscellaneous', label: 'Miscellaneous', icon: Receipt, color: 'text-slate-400', bg: 'bg-slate-500/10' },
];

const INCOME_CATEGORIES = [
  { value: 'salary', label: 'Salary', icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { value: 'freelance', label: 'Freelance', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { value: 'investment', label: 'Investment', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
  { value: 'rental', label: 'Rental Income', icon: Home, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { value: 'gift', label: 'Gift', icon: Gift, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { value: 'refund', label: 'Refund', icon: DollarSign, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { value: 'other', label: 'Other', icon: DollarSign, color: 'text-slate-400', bg: 'bg-slate-500/10' },
];

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
  const [unplannedExpenseCategory, setUnplannedExpenseCategory] = useState('miscellaneous');
  const [unplannedIncome, setUnplannedIncome] = useState('');
  const [unplannedIncomeCategory, setUnplannedIncomeCategory] = useState('other');
  const [isEditing, setIsEditing] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

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

  const getCategoryDetails = (value: string, type: 'expense' | 'income') => {
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    return categories.find(c => c.value === value) || categories[categories.length - 1];
  };

  if (isLoading) {
    return (
      <div className="finance-card min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Month Card */}
      <div className="finance-card">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white tracking-tight">
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

        {/* Confirmation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Confirm Expenses */}
          <button
            onClick={() => !isValidated || canEdit ? setConfirmedExpenses(!confirmedExpenses) : null}
            disabled={isValidated && !canEdit}
            className={`p-5 rounded-xl border transition-all duration-200 text-left ${
              confirmedExpenses
                ? 'bg-emerald-500/[0.05] border-emerald-500/20'
                : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
            } ${isValidated && !canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                confirmedExpenses 
                  ? 'bg-emerald-500/20 border-emerald-500' 
                  : 'border-slate-500'
              }`}>
                {confirmedExpenses && <Check className="h-4 w-4 text-emerald-400" />}
              </div>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-rose-400" />
              </div>
              <span className="text-base font-medium text-white">Expenses Paid</span>
            </div>
            <p className="text-sm text-slate-400 ml-[3.75rem]">
              {formatCurrency(totalRecurringExpenses, currency)} recurring
            </p>
          </button>

          {/* Confirm Income */}
          <button
            onClick={() => !isValidated || canEdit ? setConfirmedIncome(!confirmedIncome) : null}
            disabled={isValidated && !canEdit}
            className={`p-5 rounded-xl border transition-all duration-200 text-left ${
              confirmedIncome
                ? 'bg-emerald-500/[0.05] border-emerald-500/20'
                : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
            } ${isValidated && !canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                confirmedIncome 
                  ? 'bg-emerald-500/20 border-emerald-500' 
                  : 'border-slate-500'
              }`}>
                {confirmedIncome && <Check className="h-4 w-4 text-emerald-400" />}
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-base font-medium text-white">Income Received</span>
            </div>
            <p className="text-sm text-slate-400 ml-[3.75rem]">
              {formatCurrency(totalRecurringIncome, currency)} recurring
            </p>
          </button>
        </div>

        {/* Additional Amounts with Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* Additional Expenses */}
          <div className="space-y-3">
            <label className="text-sm text-slate-300 font-medium">Additional Expenses</label>
            <div className="flex gap-2">
              <Select 
                value={unplannedExpenseCategory} 
                onValueChange={setUnplannedExpenseCategory}
                disabled={isValidated && !canEdit}
              >
                <SelectTrigger className="w-[140px] finance-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${cat.color}`} />
                          <span className="text-sm">{cat.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
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
                  className="pl-7 finance-input"
                />
              </div>
            </div>
          </div>

          {/* Additional Income */}
          <div className="space-y-3">
            <label className="text-sm text-slate-300 font-medium">Additional Income</label>
            <div className="flex gap-2">
              <Select 
                value={unplannedIncomeCategory} 
                onValueChange={setUnplannedIncomeCategory}
                disabled={isValidated && !canEdit}
              >
                <SelectTrigger className="w-[140px] finance-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${cat.color}`} />
                          <span className="text-sm">{cat.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
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
                  className="pl-7 finance-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isValidated && (
          <Button
            onClick={handleValidate}
            disabled={!confirmedExpenses || !confirmedIncome || upsertValidation.isPending}
            className="w-full h-12 text-base font-medium"
          >
            {upsertValidation.isPending ? 'Validating...' : 'Validate This Month'}
          </Button>
        )}
        
        {canEdit && (
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="flex-1 h-12 border-white/[0.1] text-slate-300 hover:bg-white/[0.04] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={upsertValidation.isPending}
              className="flex-1 h-12"
            >
              {upsertValidation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* Past Months Archive */}
      <div className="finance-card">
        <h3 className="text-base font-semibold text-white mb-5">Monthly History</h3>
        
        <div className="space-y-2">
          {pastMonths.map((month) => (
            <Collapsible
              key={month.key}
              open={expandedMonths.includes(month.key)}
              onOpenChange={() => toggleMonth(month.key)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-200">
                  <div className="flex items-center gap-3">
                    {expandedMonths.includes(month.key) ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="text-sm font-medium text-white">{month.label}</span>
                  </div>
                  {month.validation?.validated_at ? (
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs text-emerald-400">Validated</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Not validated</span>
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-5 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                  {month.validation ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Income</p>
                        <p className="text-lg font-semibold text-emerald-400 tabular-nums">
                          {formatCurrency(month.validation.actual_total_income || 0, currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Expenses</p>
                        <p className="text-lg font-semibold text-rose-400 tabular-nums">
                          {formatCurrency(month.validation.actual_total_expenses || 0, currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Net</p>
                        <p className={`text-lg font-semibold tabular-nums ${
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
                        <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Unplanned</p>
                        <p className="text-sm text-white tabular-nums">
                          <span className="text-emerald-400">+{formatCurrency(month.validation.unplanned_income || 0, currency)}</span>
                          {' / '}
                          <span className="text-rose-400">-{formatCurrency(month.validation.unplanned_expenses || 0, currency)}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">
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
