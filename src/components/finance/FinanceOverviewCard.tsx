import { motion } from 'framer-motion';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { TrendingUp, TrendingDown, Wallet, Target, Info, Sparkles } from 'lucide-react';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="neu-card h-full relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent opacity-60" />
      
      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsla(200,100%,60%,0.15) 0%, hsla(200,100%,60%,0.05) 100%)',
                border: '1px solid hsla(200,100%,60%,0.25)',
                boxShadow: '0 0 30px hsla(200,100%,60%,0.15)',
              }}
            >
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Project Financing</h2>
              <p className="text-sm text-slate-500">Budget overview</p>
            </div>
          </div>
          {isCustomMode && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 shadow-[0_0_15px_hsla(40,90%,50%,0.15)]"
            >
              <Target className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">Custom</span>
            </motion.div>
          )}
        </div>

        {/* Stats Grid */}
        <div className={`grid gap-4 mb-8 ${isCustomMode ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
          {/* Total Target */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="neu-inset p-5 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                {isCustomMode ? 'Custom Target' : 'Total Target'}
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
              {formatCurrency(totalEstimated, currency)}
            </p>
            {isCustomMode && (
              <div className="flex items-center gap-1.5 mt-3">
                <Info className="h-3 w-3 text-slate-500" />
                <span className="text-xs text-slate-500">Not linked to goals</span>
              </div>
            )}
          </motion.div>

          {/* Financed - Hidden in custom mode */}
          {!isCustomMode && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="neu-inset p-5 rounded-xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400/80 font-medium uppercase tracking-wider">
                    Financed
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums tracking-tight">
                  {formatCurrency(totalPaid, currency)}
                </p>
              </div>
            </motion.div>
          )}

          {/* Remaining */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="neu-inset p-5 rounded-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.08] to-transparent" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-amber-400/80 font-medium uppercase tracking-wider">
                  Remaining
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-amber-400 tabular-nums tracking-tight">
                {formatCurrency(totalRemaining, currency)}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-400 font-medium">Progress</span>
            </div>
            <span className="text-sm text-white font-bold tabular-nums">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06] neu-inset">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="h-full rounded-full relative"
              style={{
                background: 'linear-gradient(90deg, hsla(200,100%,50%,0.8) 0%, hsla(200,100%,60%,1) 50%, hsla(180,80%,50%,0.9) 100%)',
                boxShadow: '0 0 20px hsla(200,100%,60%,0.4)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}