import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Activity } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { AnimatedNumber } from './widgets/AnimatedNumber';
import { roundMoney } from '@/lib/financeCategories';

interface FinanceVaultHeroProps {
  netWorth: number;
  monthlyNet: number;
  totalExpenses: number;
  prevMonthNet: number | null;
  healthScore: number;
  transactions: Array<{ transaction_date: string; amount: number; transaction_type: string }>;
  accountsCount: number;
}

export function FinanceVaultHero({
  netWorth,
  monthlyNet,
  totalExpenses,
  prevMonthNet,
  healthScore,
  transactions,
  accountsCount,
}: FinanceVaultHeroProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // 30-day cash flow sparkline
  const sparklinePath = useMemo(() => {
    const today = new Date();
    const days: number[] = [];
    let running = 0;
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(today, i), 'yyyy-MM-dd');
      const dayNet = transactions
        .filter((tx) => tx.transaction_date === d)
        .reduce((s, tx) => s + (tx.transaction_type === 'credit' ? Number(tx.amount) : -Number(tx.amount)), 0);
      running += dayNet;
      days.push(running);
    }
    if (days.length === 0) return { path: '', area: '', last: 0 };
    const min = Math.min(...days, 0);
    const max = Math.max(...days, 0);
    const range = max - min || 1;
    const w = 280;
    const h = 56;
    const step = w / (days.length - 1 || 1);
    const points = days.map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return {
      path: `M ${points.join(' L ')}`,
      area: `M 0,${h} L ${points.join(' L ')} L ${w},${h} Z`,
      last: days[days.length - 1],
    };
  }, [transactions]);

  const delta = prevMonthNet !== null && prevMonthNet !== 0
    ? roundMoney(((monthlyNet - prevMonthNet) / Math.abs(prevMonthNet)) * 100)
    : null;
  const deltaAbs = prevMonthNet !== null ? roundMoney(monthlyNet - prevMonthNet) : null;
  const deltaPositive = (deltaAbs ?? 0) >= 0;

  const liquidityMonths = totalExpenses > 0 ? roundMoney(netWorth / totalExpenses) : null;
  const burnRate = totalExpenses;

  const healthColor =
    healthScore >= 75 ? 'text-emerald-400 bg-emerald-400' :
    healthScore >= 50 ? 'text-amber-400 bg-amber-400' :
    'text-rose-400 bg-rose-400';

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative neu-card overflow-hidden border border-primary/10"
      aria-label={t('finance.vault.heroAria', 'Vault overview')}
    >
      {/* Radial bg */}
      <div className="absolute inset-0 pointer-events-none opacity-60"
        style={{ background: 'radial-gradient(ellipse at 80% 0%, hsla(200,100%,60%,0.10) 0%, transparent 55%)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px)`, backgroundSize: '100% 28px' }} />

      {/* Tactical header */}
      <div className="relative z-10 flex items-center justify-between px-5 sm:px-7 pt-4 pb-3 border-b border-border/40 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="text-primary font-semibold">FINANCE</span>
          <span className="text-muted-foreground/50">/</span>
          <span>ACCT_{accountsCount.toString().padStart(2, '0')}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping motion-reduce:animate-none" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            LIVE
          </span>
          <span className="tabular-nums hidden sm:inline">{format(now, 'HH:mm')} UTC</span>
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 px-5 sm:px-7 py-6">
        {/* Net worth */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
            {t('finance.accounts.netWorth')}
          </p>
          <div className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight font-mono tabular-nums break-all">
            <AnimatedNumber
              value={netWorth}
              currency={currency}
              isPositive={netWorth >= 0}
              className={netWorth >= 0 ? 'text-foreground' : 'text-rose-400'}
            />
          </div>
          {deltaAbs !== null && (
            <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-mono tabular-nums ${deltaPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {deltaPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{deltaPositive ? '+' : ''}{formatCurrency(deltaAbs, currency)}</span>
              {delta !== null && <span className="text-muted-foreground">({deltaPositive ? '+' : ''}{delta.toFixed(1)}%) {t('finance.vault.vsLastMonth', 'vs last month')}</span>}
            </div>
          )}
        </div>

        {/* Cashflow sparkline */}
        <div className="lg:border-l lg:border-border/40 lg:pl-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              {t('finance.vault.cashFlow30d', 'Cash flow · 30d')}
            </p>
            <span className={`text-xs font-mono tabular-nums ${sparklinePath.last >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {sparklinePath.last >= 0 ? '+' : ''}{formatCurrency(sparklinePath.last, currency)}
            </span>
          </div>
          <svg viewBox="0 0 280 56" className="w-full h-14" preserveAspectRatio="none">
            <defs>
              <linearGradient id="vault-spark-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparklinePath.last >= 0 ? 'hsl(160 84% 50%)' : 'hsl(350 80% 60%)'} stopOpacity="0.35" />
                <stop offset="100%" stopColor={sparklinePath.last >= 0 ? 'hsl(160 84% 50%)' : 'hsl(350 80% 60%)'} stopOpacity="0" />
              </linearGradient>
            </defs>
            {sparklinePath.area && <path d={sparklinePath.area} fill="url(#vault-spark-grad)" />}
            {sparklinePath.path && (
              <path
                d={sparklinePath.path}
                fill="none"
                stroke={sparklinePath.last >= 0 ? 'hsl(160 84% 50%)' : 'hsl(350 80% 60%)'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Bottom strip — tactical ratios */}
      <div className="relative z-10 grid grid-cols-3 border-t border-border/40 divide-x divide-border/40 font-mono">
        <Stat
          label={t('finance.vault.liquidity', 'Liquidity')}
          value={liquidityMonths !== null ? `${liquidityMonths.toFixed(1)} ${t('finance.vault.mo', 'mo')}` : '—'}
          ledClass="bg-primary"
        />
        <Stat
          label={t('finance.vault.burnRate', 'Burn rate')}
          value={`${formatCurrency(burnRate, currency)} /${t('finance.vault.moShort', 'mo')}`}
          ledClass="bg-rose-400"
        />
        <Stat
          label={t('finance.healthScore.title')}
          value={
            <span className="inline-flex items-center gap-2">
              <Activity className={`w-3.5 h-3.5 ${healthColor.split(' ')[0]}`} />
              <span className={healthColor.split(' ')[0]}>{healthScore}/100</span>
            </span>
          }
          ledClass={healthColor.split(' ')[1]}
        />
      </div>
    </motion.section>
  );
}

function Stat({
  label,
  value,
  ledClass,
}: {
  label: string;
  value: React.ReactNode;
  ledClass: string;
}) {
  return (
    <div className="px-4 py-3 sm:px-5 sm:py-3.5">
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
        <span className={`w-1.5 h-1.5 rounded-full ${ledClass} shadow-[0_0_6px_currentColor]`} />
        <span>{label}</span>
      </div>
      <p className="text-sm sm:text-base font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}
