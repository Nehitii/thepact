import { useTranslation } from 'react-i18next';
import { ArrowDownRight, ArrowUpRight, AlertTriangle, Circle } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';

interface FinanceTickerBarProps {
  totalIncome: number;
  totalExpenses: number;
  monthlyNet: number;
  budgetPct: number | null;
  alertCount: number;
}

export function FinanceTickerBar({
  totalIncome,
  totalExpenses,
  monthlyNet,
  budgetPct,
  alertCount,
}: FinanceTickerBarProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const cur = currency.toUpperCase();

  return (
    <div
      className="neu-inset rounded-xl px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-hide font-mono text-[11px] sm:text-xs whitespace-nowrap"
      role="status"
      aria-label={t('finance.vault.tickerAria', 'Live financial summary')}
    >
      <span className="flex items-center gap-1.5 text-primary font-semibold uppercase tracking-wider">
        <Circle className="w-1.5 h-1.5 fill-emerald-400 text-emerald-400" />
        {cur} · LIVE
      </span>
      <Sep />
      <span className="flex items-center gap-1.5 text-emerald-400 tabular-nums">
        <ArrowUpRight className="w-3 h-3" />
        {t('finance.monthly.income')} +{formatCurrency(totalIncome, currency)}
      </span>
      <span className="flex items-center gap-1.5 text-rose-400 tabular-nums">
        <ArrowDownRight className="w-3 h-3" />
        {t('finance.monthly.expenses')} −{formatCurrency(totalExpenses, currency)}
      </span>
      <span className={`flex items-center gap-1.5 tabular-nums font-semibold ${monthlyNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        <Circle className={`w-2 h-2 fill-current`} />
        {t('finance.monthly.net')} {monthlyNet >= 0 ? '+' : ''}{formatCurrency(monthlyNet, currency)}
      </span>
      <Sep />
      {budgetPct !== null && (
        <>
          <span className="text-muted-foreground tabular-nums">
            {t('finance.tabs.budget')} {budgetPct}%
          </span>
          <Sep />
        </>
      )}
      {alertCount > 0 ? (
        <span className="flex items-center gap-1 text-amber-400">
          <AlertTriangle className="w-3 h-3" /> {alertCount} {alertCount > 1 ? 'alerts' : 'alert'}
        </span>
      ) : (
        <span className="text-muted-foreground/70">No alerts</span>
      )}
    </div>
  );
}

function Sep() {
  return <span className="text-border/60" aria-hidden="true">│</span>;
}
