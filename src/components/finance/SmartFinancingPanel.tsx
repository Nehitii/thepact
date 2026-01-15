import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { differenceInMonths, addMonths, format } from 'date-fns';
import { AlertCircle, CheckCircle, Calculator, Wallet, Calendar } from 'lucide-react';

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
  
  const amountToFinance = Math.max(0, totalRemaining - existingBalance);
  const monthsToDeadline = projectEndDate ? differenceInMonths(projectEndDate, today) : null;

  const updateFromMonths = useCallback((newMonths: number) => {
    setMonths(newMonths);
    if (amountToFinance > 0 && newMonths > 0) {
      const newAmount = amountToFinance / newMonths;
      setMonthlyAmount(newAmount);
      setManualAmountInput('');
    }
  }, [amountToFinance]);

  const updateFromAmount = useCallback((newAmount: number) => {
    setMonthlyAmount(newAmount);
    if (amountToFinance > 0 && newAmount > 0) {
      const newMonths = Math.ceil(amountToFinance / newAmount);
      setMonths(Math.min(newMonths, maxMonths));
      setManualMonthsInput('');
    }
  }, [amountToFinance]);

  useEffect(() => {
    if (currentMonthlyAllocation > 0 && amountToFinance > 0) {
      setMonthlyAmount(currentMonthlyAllocation);
      const calculatedMonths = Math.ceil(amountToFinance / currentMonthlyAllocation);
      setMonths(Math.min(calculatedMonths, maxMonths));
    } else if (amountToFinance > 0) {
      updateFromMonths(12);
    }
  }, [currentMonthlyAllocation, amountToFinance]);

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="neu-card h-full relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] to-transparent" />
      
      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsla(180,80%,50%,0.15) 0%, hsla(180,80%,50%,0.05) 100%)',
              border: '1px solid hsla(180,80%,50%,0.25)',
              boxShadow: '0 0 30px hsla(180,80%,50%,0.15)',
            }}
          >
            <Calculator className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Smart Financing</h3>
            <p className="text-sm text-slate-500">Adjust your payment plan</p>
          </div>
        </div>

        {/* Amount to Finance */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6 p-5 rounded-xl neu-inset relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent" />
          <div className="relative">
            <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-medium">Amount to Finance</p>
            <p className="text-3xl font-bold text-primary tabular-nums" style={{ textShadow: '0 0 30px hsla(200,100%,60%,0.3)' }}>
              {formatCurrency(amountToFinance, currency)}
            </p>
            {existingBalance > 0 && (
              <p className="text-xs text-slate-500 mt-2">
                After {formatCurrency(existingBalance, currency)} existing balance
              </p>
            )}
          </div>
        </motion.div>

        {/* Existing Balance Input */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">
            <Wallet className="h-3.5 w-3.5" />
            Existing Balance Available
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              {getCurrencySymbol(currency)}
            </span>
            <Input
              type="number"
              placeholder="0.00"
              value={existingBalance || ''}
              onChange={(e) => setExistingBalance(parseFloat(e.target.value) || 0)}
              className="pl-8 h-12 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 text-white placeholder:text-slate-600 rounded-xl"
              min="0"
              step="100"
            />
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Money already set aside for this project
          </p>
        </div>

        {/* Slider Control */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold text-white">Payment Duration</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder={months.toString()}
                value={manualMonthsInput}
                onChange={(e) => setManualMonthsInput(e.target.value)}
                onBlur={handleManualMonthsSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleManualMonthsSubmit()}
                className="w-16 h-9 text-center text-sm bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-500 rounded-lg"
                min="1"
                max={maxMonths}
              />
              <span className="text-sm text-slate-400">months</span>
            </div>
          </div>
          <div className="py-2">
            <Slider
              value={[months]}
              onValueChange={([value]) => updateFromMonths(value)}
              min={1}
              max={maxMonths}
              step={1}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>1 month</span>
            <span>{maxMonths} months</span>
          </div>
        </div>

        {/* Monthly Payment Display */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6 p-5 rounded-xl neu-inset"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400 font-medium">Monthly Payment</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm">{getCurrencySymbol(currency)}</span>
              <Input
                type="number"
                placeholder={monthlyAmount.toFixed(0)}
                value={manualAmountInput}
                onChange={(e) => setManualAmountInput(e.target.value)}
                onBlur={handleManualAmountSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleManualAmountSubmit()}
                className="w-24 h-8 text-right text-sm bg-transparent border-white/[0.08] font-semibold text-white placeholder:text-slate-500 rounded-lg"
                min="1"
              />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {formatCurrency(monthlyAmount, currency)}
            <span className="text-sm font-normal text-slate-500 ml-1">/month</span>
          </p>
        </motion.div>

        {/* Status Indicator */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
            isOnTrack 
              ? 'bg-emerald-500/[0.08] border-emerald-500/25 shadow-[0_0_20px_hsla(160,80%,50%,0.1)]' 
              : 'bg-amber-500/[0.08] border-amber-500/25 shadow-[0_0_20px_hsla(40,90%,50%,0.1)]'
          }`}
        >
          {isOnTrack ? (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${isOnTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isOnTrack 
                ? "On track to meet your goal"
                : `Exceeds deadline by ${monthsOverDeadline} month${monthsOverDeadline !== 1 ? 's' : ''}`
              }
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Completion: {format(completionDate, 'MMM yyyy')}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
