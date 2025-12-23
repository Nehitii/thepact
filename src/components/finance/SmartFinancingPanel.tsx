import { useState, useEffect, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { differenceInMonths, addMonths, format } from 'date-fns';
import { AlertCircle, CheckCircle, Calculator, Wallet } from 'lucide-react';

interface SmartFinancingPanelProps {
  totalRemaining: number;
  projectEndDate: Date | null;
  currentMonthlyAllocation: number;
}

export function SmartFinancingPanel({
  totalRemaining,
  projectEndDate,
  currentMonthlyAllocation,
}: SmartFinancingPanelProps) {
  const { currency } = useCurrency();
  const [months, setMonths] = useState(12);
  const [monthlyAmount, setMonthlyAmount] = useState(currentMonthlyAllocation);
  const [existingBalance, setExistingBalance] = useState(0);
  const [manualMonthsInput, setManualMonthsInput] = useState('');
  const [manualAmountInput, setManualAmountInput] = useState('');

  const today = new Date();
  const maxMonths = 60;
  
  // Amount to finance = totalRemaining from Overview (already includes alreadyFunded)
  // Minus any existing balance user has available
  const amountToFinance = Math.max(0, totalRemaining - existingBalance);

  // Calculate months to deadline
  const monthsToDeadline = projectEndDate ? differenceInMonths(projectEndDate, today) : null;

  // Update monthly amount when months changes
  const updateFromMonths = useCallback((newMonths: number) => {
    setMonths(newMonths);
    if (amountToFinance > 0 && newMonths > 0) {
      const newAmount = amountToFinance / newMonths;
      setMonthlyAmount(newAmount);
      setManualAmountInput('');
    }
  }, [amountToFinance]);

  // Update months when amount changes
  const updateFromAmount = useCallback((newAmount: number) => {
    setMonthlyAmount(newAmount);
    if (amountToFinance > 0 && newAmount > 0) {
      const newMonths = Math.ceil(amountToFinance / newAmount);
      setMonths(Math.min(newMonths, maxMonths));
      setManualMonthsInput('');
    }
  }, [amountToFinance]);

  // Initialize from props
  useEffect(() => {
    if (currentMonthlyAllocation > 0 && amountToFinance > 0) {
      setMonthlyAmount(currentMonthlyAllocation);
      const calculatedMonths = Math.ceil(amountToFinance / currentMonthlyAllocation);
      setMonths(Math.min(calculatedMonths, maxMonths));
    } else if (amountToFinance > 0) {
      updateFromMonths(12);
    }
  }, [currentMonthlyAllocation, amountToFinance]);

  // Recalculate when existing balance changes
  useEffect(() => {
    if (amountToFinance > 0 && months > 0) {
      setMonthlyAmount(amountToFinance / months);
    }
  }, [existingBalance]);

  const completionDate = addMonths(today, months);
  const isOnTrack = monthsToDeadline !== null ? months <= monthsToDeadline : true;
  const monthsOverDeadline = monthsToDeadline !== null ? Math.max(0, months - monthsToDeadline) : 0;

  const handleManualMonthsSubmit = () => {
    const value = parseInt(manualMonthsInput);
    if (!isNaN(value) && value >= 1 && value <= maxMonths) {
      updateFromMonths(value);
    }
    setManualMonthsInput('');
  };

  const handleManualAmountSubmit = () => {
    const value = parseFloat(manualAmountInput);
    if (!isNaN(value) && value > 0) {
      updateFromAmount(value);
    }
    setManualAmountInput('');
  };

  return (
    <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 transition-all duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Smart Financing</h3>
          <p className="text-xs text-slate-400">Adjust your payment plan</p>
        </div>
      </div>

      {/* Amount to Finance - synced with Overview Remaining */}
      <div className="text-center mb-6 p-4 rounded-xl bg-primary/[0.05] border border-primary/[0.1]">
        <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide font-medium">Amount to Finance</p>
        <p className="text-3xl font-semibold text-primary tabular-nums">
          {formatCurrency(amountToFinance, currency)}
        </p>
        {existingBalance > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            After {formatCurrency(existingBalance, currency)} existing balance
          </p>
        )}
      </div>

      {/* Existing Balance Input */}
      <div className="mb-6">
        <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">
          <Wallet className="h-3 w-3 inline mr-1.5" />
          Existing Balance Available
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            {getCurrencySymbol(currency)}
          </span>
          <Input
            type="number"
            placeholder="0.00"
            value={existingBalance || ''}
            onChange={(e) => setExistingBalance(parseFloat(e.target.value) || 0)}
            className="pl-7 bg-white/[0.04] border-white/[0.12] focus:border-primary/50 h-11 text-white placeholder:text-slate-500"
            min="0"
            step="100"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          Money already set aside for this project
        </p>
      </div>

      {/* Slider Control */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white">Payment Duration</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder={months.toString()}
              value={manualMonthsInput}
              onChange={(e) => setManualMonthsInput(e.target.value)}
              onBlur={handleManualMonthsSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleManualMonthsSubmit()}
              className="w-16 h-8 text-center text-sm bg-white/[0.04] border-white/[0.12] text-white placeholder:text-slate-500"
              min="1"
              max={maxMonths}
            />
            <span className="text-sm text-slate-400">months</span>
          </div>
        </div>
        <Slider
          value={[months]}
          onValueChange={([value]) => updateFromMonths(value)}
          min={1}
          max={maxMonths}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>1 month</span>
          <span>{maxMonths} months</span>
        </div>
      </div>

      {/* Monthly Payment Display */}
      <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400 font-medium">Monthly Payment</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">{getCurrencySymbol(currency)}</span>
            <Input
              type="number"
              placeholder={monthlyAmount.toFixed(0)}
              value={manualAmountInput}
              onChange={(e) => setManualAmountInput(e.target.value)}
              onBlur={handleManualAmountSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleManualAmountSubmit()}
              className="w-24 h-8 text-right text-sm bg-transparent border-white/[0.12] font-semibold text-white placeholder:text-slate-500"
              min="1"
            />
          </div>
        </div>
        <p className="text-xl font-semibold text-white mt-2 tabular-nums">
          {formatCurrency(monthlyAmount, currency)}
          <span className="text-sm font-normal text-slate-400 ml-1">/month</span>
        </p>
      </div>

      {/* Status Indicator */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
        isOnTrack 
          ? 'bg-emerald-500/[0.05] border-emerald-500/[0.15]' 
          : 'bg-amber-500/[0.05] border-amber-500/[0.15]'
      }`}>
        {isOnTrack ? (
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isOnTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isOnTrack 
              ? "On track to meet your goal"
              : `Exceeds deadline by ${monthsOverDeadline} month${monthsOverDeadline !== 1 ? 's' : ''}`
            }
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Completion: {format(completionDate, 'MMM yyyy')}
          </p>
        </div>
      </div>
    </div>
  );
}
