import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface FinanceOverviewCardProps {
  totalEstimated: number;
  totalPaid: number;
  totalRemaining: number;
}

export function FinanceOverviewCard({ 
  totalEstimated, 
  totalPaid, 
  totalRemaining 
}: FinanceOverviewCardProps) {
  const { currency } = useCurrency();
  const progressPercentage = totalEstimated > 0 ? (totalPaid / totalEstimated) * 100 : 0;

  return (
    <div className="relative overflow-hidden">
      {/* Main Card */}
      <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 transition-all duration-500">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Project Financing</h2>
            <p className="text-xs text-slate-400">Budget overview</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Total Estimated */}
          <div className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
              Total Estimated
            </p>
            <p className="text-xl font-semibold text-white tabular-nums">
              {formatCurrency(totalEstimated, currency)}
            </p>
          </div>

          {/* Paid / Financed */}
          <div className="text-center p-4 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/[0.1]">
            <div className="flex items-center justify-center gap-1 mb-1.5">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <p className="text-xs text-emerald-400 font-medium uppercase tracking-wide">
                Financed
              </p>
            </div>
            <p className="text-xl font-semibold text-emerald-400 tabular-nums">
              {formatCurrency(totalPaid, currency)}
            </p>
          </div>

          {/* Remaining */}
          <div className="text-center p-4 rounded-xl bg-amber-500/[0.05] border border-amber-500/[0.1]">
            <div className="flex items-center justify-center gap-1 mb-1.5">
              <TrendingDown className="h-3 w-3 text-amber-400" />
              <p className="text-xs text-amber-400 font-medium uppercase tracking-wide">
                Remaining
              </p>
            </div>
            <p className="text-xl font-semibold text-amber-400 tabular-nums">
              {formatCurrency(totalRemaining, currency)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-medium">Progress</span>
            <span className="text-white font-semibold tabular-nums">{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}