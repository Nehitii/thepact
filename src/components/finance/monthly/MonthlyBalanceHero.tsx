import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AnimatedNumber, SavingsRateRing } from '../widgets';

interface MonthlyBalanceHeroProps {
  totalIncome: number;
  totalExpenses: number;
}

export function MonthlyBalanceHero({ totalIncome, totalExpenses }: MonthlyBalanceHeroProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const netBalance = totalIncome - totalExpenses;
  const isPositive = netBalance >= 0;

  const savingsRate = useMemo(() => {
    if (totalIncome === 0) return 0;
    return Math.round((netBalance / totalIncome) * 100);
  }, [netBalance, totalIncome]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div className="aura-glass p-8 md:p-10 relative overflow-hidden">
        <div
          className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
            isPositive ? 'opacity-25' : 'opacity-20'
          }`}
          style={{
            background: isPositive
              ? 'radial-gradient(circle, hsl(var(--aura-mint) / 0.55), transparent 70%)'
              : 'radial-gradient(circle, hsl(350 80% 65% / 0.5), transparent 70%)',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {t('finance.monthly.monthlyBalance')}
                </span>
                <p className="text-xs text-muted-foreground/60">{t('finance.monthly.currentPeriod')}</p>
              </div>
            </div>

            {totalIncome > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              >
                <SavingsRateRing rate={savingsRate} />
              </motion.div>
            )}
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <div className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight font-mono tabular-nums">
              <AnimatedNumber value={netBalance} currency={currency} isPositive={isPositive} />
            </div>
          </motion.div>

          {/* In/Out ratio bar */}
          {(totalIncome > 0 || totalExpenses > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-8 max-w-2xl mx-auto"
            >
              <div className="flex items-center justify-between mb-2 font-mono text-[10px] uppercase tracking-[0.18em]">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_currentColor]" />
                  {t('finance.monthly.income')} · {Math.round((totalIncome / Math.max(totalIncome + totalExpenses, 1)) * 100)}%
                </span>
                <span className="text-rose-400 flex items-center gap-1.5">
                  {t('finance.monthly.expenses')} · {Math.round((totalExpenses / Math.max(totalIncome + totalExpenses, 1)) * 100)}%
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_currentColor]" />
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-muted/40 flex">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(totalIncome / Math.max(totalIncome + totalExpenses, 1)) * 100}%` }}
                  transition={{ delay: 0.6, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(totalExpenses / Math.max(totalIncome + totalExpenses, 1)) * 100}%` }}
                  transition={{ delay: 0.6, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-gradient-to-r from-rose-500 to-rose-400"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}