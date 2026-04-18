import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AnimatedNumber } from '../widgets/AnimatedNumber';
import { CashFlowCurve } from './CashFlowCurve';
import { VirtualCard } from './VirtualCard';
import type { BankTransaction } from '@/types/finance';

interface AuraBalanceHeroProps {
  netWorth: number;
  prevMonthNet: number | null;
  monthlyNet: number;
  transactions: BankTransaction[];
  accountsCount: number;
  holderName?: string;
}

export function AuraBalanceHero({
  netWorth,
  prevMonthNet,
  monthlyNet,
  transactions,
  accountsCount,
  holderName,
}: AuraBalanceHeroProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();

  // 30-day cumulative cash flow series
  const cashFlowSeries = useMemo(() => {
    const days = 30;
    const today = new Date();
    const buckets: number[] = new Array(days).fill(0);
    const fromKey = format(subDays(today, days - 1), 'yyyy-MM-dd');
    transactions.forEach((tx) => {
      if (tx.transaction_date < fromKey) return;
      const idx = days - 1 - Math.min(days - 1, Math.floor((today.getTime() - new Date(tx.transaction_date).getTime()) / 86400000));
      if (idx < 0 || idx >= days) return;
      const sign = tx.transaction_type === 'credit' ? 1 : -1;
      buckets[idx] += sign * Number(tx.amount);
    });
    // cumulative
    let acc = 0;
    return buckets.map((v) => (acc += v));
  }, [transactions]);

  const deltaPct = useMemo(() => {
    if (prevMonthNet === null || prevMonthNet === 0) return null;
    return ((monthlyNet - prevMonthNet) / Math.abs(prevMonthNet)) * 100;
  }, [monthlyNet, prevMonthNet]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="aura-glass relative overflow-hidden p-6 sm:p-8 lg:p-10"
      aria-label={t('finance.aura.heroAria', 'Total balance overview')}
    >
      {/* Inner glow */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--aura-electric) / 0.5), transparent 70%)' }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-center">
        {/* Left: Balance */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/80">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--aura-mint))] shadow-[0_0_8px_hsl(var(--aura-mint))]" />
            {t('finance.aura.totalBalance', 'Total Balance')}
          </div>

          <div className="mt-3 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground tabular-nums leading-none">
            <AnimatedNumber value={netWorth} currency={currency} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            {deltaPct !== null ? (
              <span
                className={`inline-flex items-center gap-1.5 font-medium ${
                  deltaPct >= 0 ? 'text-[hsl(var(--aura-mint))]' : 'text-rose-400'
                }`}
              >
                {deltaPct >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {deltaPct >= 0 ? '+' : ''}
                {deltaPct.toFixed(1)}%
                <span className="text-muted-foreground/70 font-normal ml-1">
                  {t('finance.aura.thisMonth', 'this month')}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Minus className="w-4 h-4" />
                {t('finance.aura.noComparison', 'No previous data')}
              </span>
            )}
            <span className="text-xs text-muted-foreground/60 font-mono">
              {accountsCount} {t('finance.aura.accounts', 'accounts')}
            </span>
          </div>

          {/* Cash flow curve */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60">
                {t('finance.aura.cashFlow30d', 'Cash flow · 30 days')}
              </span>
            </div>
            <CashFlowCurve values={cashFlowSeries} height={72} />
          </div>
        </div>

        {/* Right: Virtual Card */}
        <div className="w-full lg:w-auto flex justify-center lg:justify-end">
          <VirtualCard currency={currency} accountId={String(accountsCount)} holderName={holderName} />
        </div>
      </div>
    </motion.section>
  );
}
