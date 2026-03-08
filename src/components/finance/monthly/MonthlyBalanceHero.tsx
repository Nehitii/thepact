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
      <div className="neu-card p-8 md:p-10 relative overflow-hidden">
        <div
          className={`absolute inset-0 opacity-40 blur-[100px] transition-colors duration-1000 ${
            isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'
          }`}
        />
        <div className="absolute inset-0 mesh-gradient-bg opacity-50" />

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
            <div className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <AnimatedNumber value={netBalance} currency={currency} isPositive={isPositive} />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}