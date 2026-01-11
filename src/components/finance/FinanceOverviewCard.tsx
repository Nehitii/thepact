import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { TrendingUp, TrendingDown, Wallet, Target, Info } from 'lucide-react';

interface FinanceOverviewCardProps {
  totalEstimated: number;
  totalPaid: number;
  totalRemaining: number;
  isCustomMode?: boolean;
}

export function FinanceOverviewCard({ 
  totalEstimated, 
  totalPaid, 
  totalRemaining,
  isCustomMode = false,
}: FinanceOverviewCardProps) {
  const { currency } = useCurrency();
  const progressPercentage = totalEstimated > 0 ? (totalPaid / totalEstimated) * 100 : 0;

  return (
    <div className="finance-card h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Project Financing</h2>
            <p className="text-sm text-slate-500">Budget overview</p>
          </div>
        </div>
        {isCustomMode && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Target className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Custom</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-4 mb-8 ${isCustomMode ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {/* Total Target */}
        <div className="finance-stat-card">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {isCustomMode ? 'Custom Target' : 'Total Target'}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-white tabular-nums tracking-tight">
            {formatCurrency(totalEstimated, currency)}
          </p>
          {isCustomMode && (
            <div className="flex items-center gap-1.5 mt-2">
              <Info className="h-3 w-3 text-slate-500" />
              <span className="text-xs text-slate-500">Not linked to goals</span>
            </div>
          )}
        </div>

        {/* Financed - Hidden in custom mode */}
        {!isCustomMode && (
          <div className="finance-stat-card bg-emerald-500/[0.03] border-emerald-500/10">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-emerald-400/80 font-medium uppercase tracking-wider">
                Financed
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-emerald-400 tabular-nums tracking-tight">
              {formatCurrency(totalPaid, currency)}
            </p>
          </div>
        )}

        {/* Remaining */}
        <div className="finance-stat-card bg-amber-500/[0.03] border-amber-500/10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-amber-400/80 font-medium uppercase tracking-wider">
              Remaining
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-amber-400 tabular-nums tracking-tight">
            {formatCurrency(totalRemaining, currency)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400 font-medium">Progress</span>
          <span className="text-sm text-white font-semibold tabular-nums">
            {progressPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-2.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
          <div 
            className="h-full bg-gradient-to-r from-primary/80 via-primary to-primary/90 rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
