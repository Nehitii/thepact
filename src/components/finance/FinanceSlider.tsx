import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { differenceInMonths, addMonths, format, parseISO } from 'date-fns';
import { AlertCircle, CheckCircle, Calendar, Wallet } from 'lucide-react';

interface FinanceSliderProps {
  totalRemaining: number;
  projectEndDate: Date | null;
  currentMonthlyAllocation: number;
  onAllocationChange: (amount: number) => void;
}

type SliderMode = 'months' | 'amount';

export function FinanceSlider({
  totalRemaining,
  projectEndDate,
  currentMonthlyAllocation,
  onAllocationChange,
}: FinanceSliderProps) {
  const { currency } = useCurrency();
  const [mode, setMode] = useState<SliderMode>('months');
  const [months, setMonths] = useState(12);
  const [amount, setAmount] = useState(currentMonthlyAllocation);

  const today = new Date();
  const maxMonths = 60; // 5 years max
  const minAmount = 10;
  const maxAmount = Math.max(totalRemaining, 5000);

  // Calculate months to deadline
  const monthsToDeadline = projectEndDate ? differenceInMonths(projectEndDate, today) : null;

  // Sync between modes
  useEffect(() => {
    if (mode === 'months' && totalRemaining > 0) {
      const calculatedAmount = totalRemaining / months;
      setAmount(calculatedAmount);
      onAllocationChange(calculatedAmount);
    }
  }, [months, mode, totalRemaining]);

  useEffect(() => {
    if (mode === 'amount' && amount > 0) {
      const calculatedMonths = Math.ceil(totalRemaining / amount);
      setMonths(Math.min(calculatedMonths, maxMonths));
      onAllocationChange(amount);
    }
  }, [amount, mode, totalRemaining]);

  // Initialize from current allocation
  useEffect(() => {
    if (currentMonthlyAllocation > 0) {
      setAmount(currentMonthlyAllocation);
      if (totalRemaining > 0) {
        const calculatedMonths = Math.ceil(totalRemaining / currentMonthlyAllocation);
        setMonths(Math.min(calculatedMonths, maxMonths));
      }
    }
  }, [currentMonthlyAllocation, totalRemaining]);

  const completionDate = addMonths(today, months);
  const isOnTrack = monthsToDeadline !== null ? months <= monthsToDeadline : true;
  const monthsOverDeadline = monthsToDeadline !== null ? Math.max(0, months - monthsToDeadline) : 0;

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-primary/10 rounded-xl blur-2xl opacity-30" />
      <div className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/40 rounded-xl p-6 overflow-hidden">
        {/* Header with Mode Toggle */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-orbitron font-bold text-primary tracking-wider">
            SMART FINANCING
          </h3>
          <div className="flex bg-card/50 rounded-lg p-1 border border-primary/20">
            <button
              onClick={() => setMode('months')}
              className={`px-4 py-2 rounded-md text-xs font-rajdhani uppercase tracking-wider transition-all ${
                mode === 'months'
                  ? 'bg-primary/20 text-primary shadow-[0_0_10px_rgba(91,180,255,0.3)]'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <Calendar className="h-3 w-3 inline mr-1" />
              Months
            </button>
            <button
              onClick={() => setMode('amount')}
              className={`px-4 py-2 rounded-md text-xs font-rajdhani uppercase tracking-wider transition-all ${
                mode === 'amount'
                  ? 'bg-primary/20 text-primary shadow-[0_0_10px_rgba(91,180,255,0.3)]'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <Wallet className="h-3 w-3 inline mr-1" />
              Amount
            </button>
          </div>
        </div>

        {/* Main Value Display */}
        <div className="text-center mb-8">
          {mode === 'months' ? (
            <>
              <p className="text-xs font-rajdhani text-muted-foreground uppercase tracking-wider mb-2">
                I want to finish in
              </p>
              <p className="text-5xl font-orbitron font-bold text-primary drop-shadow-[0_0_20px_rgba(91,180,255,0.5)]">
                {months}
                <span className="text-xl text-muted-foreground ml-2">months</span>
              </p>
              <p className="text-sm font-rajdhani text-muted-foreground mt-2">
                Monthly payment: {formatCurrency(amount, currency)}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-rajdhani text-muted-foreground uppercase tracking-wider mb-2">
                I can pay monthly
              </p>
              <p className="text-5xl font-orbitron font-bold text-primary drop-shadow-[0_0_20px_rgba(91,180,255,0.5)]">
                {formatCurrency(amount, currency)}
              </p>
              <p className="text-sm font-rajdhani text-muted-foreground mt-2">
                Completion in: {months} months
              </p>
            </>
          )}
        </div>

        {/* Slider */}
        <div className="mb-8 px-4">
          {mode === 'months' ? (
            <Slider
              value={[months]}
              onValueChange={([value]) => setMonths(value)}
              min={1}
              max={maxMonths}
              step={1}
              className="w-full"
            />
          ) : (
            <Slider
              value={[amount]}
              onValueChange={([value]) => setAmount(value)}
              min={minAmount}
              max={maxAmount}
              step={10}
              className="w-full"
            />
          )}
          <div className="flex justify-between text-xs font-rajdhani text-muted-foreground mt-2">
            {mode === 'months' ? (
              <>
                <span>1 month</span>
                <span>{maxMonths} months</span>
              </>
            ) : (
              <>
                <span>{formatCurrency(minAmount, currency)}</span>
                <span>{formatCurrency(maxAmount, currency)}</span>
              </>
            )}
          </div>
        </div>

        {/* Status Card */}
        <div className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
          isOnTrack 
            ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
            : 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
        }`}>
          {isOnTrack ? (
            <CheckCircle className="h-5 w-5 text-green-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-orange-400" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-rajdhani ${isOnTrack ? 'text-green-400' : 'text-orange-400'}`}>
              {isOnTrack 
                ? "You are on track to meet your goal."
                : `At this pace, you will exceed your target date by ${monthsOverDeadline} month${monthsOverDeadline !== 1 ? 's' : ''}.`
              }
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-rajdhani">Completion</p>
            <p className="text-sm font-orbitron text-primary">
              {format(completionDate, 'MMM yyyy')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
