import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { roundMoney } from '@/lib/financeCategories';
import { addMonths, format } from 'date-fns';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonthlyValidations } from '@/hooks/useFinance';
import { useAccounts } from '@/hooks/useAccounts';
import { useAccountBalances } from '@/hooks/useAccountBalances';
import { SmartFinancingPanel } from './SmartFinancingPanel';

interface ProjectionsPanelProps {
  projectEndDate: Date | null;
  monthlyAllocation: number;
  totalRemaining: number;
  totalRecurringExpenses: number;
  totalRecurringIncome: number;
}

export function ProjectionsPanel({ projectEndDate, monthlyAllocation, totalRemaining, totalRecurringExpenses, totalRecurringIncome }: ProjectionsPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: validations = [] } = useMonthlyValidations(user?.id);
  const { data: accounts = [] } = useAccounts(user?.id);
  const { data: balancesMap } = useAccountBalances(accounts, user?.id);

  const monthlyNetBalance = roundMoney(totalRecurringIncome - totalRecurringExpenses);

  // Compute current net worth from balances
  const currentNetWorth = useMemo(() => {
    const activeAccounts = accounts.filter(a => a.is_active);
    if (!balancesMap || balancesMap.size === 0) {
      return roundMoney(activeAccounts.reduce((sum, a) => sum + a.balance, 0));
    }
    return roundMoney(activeAccounts.reduce((sum, a) => {
      const computed = balancesMap.get(a.id);
      return sum + (computed ? computed.computedBalance : a.balance);
    }, 0));
  }, [accounts, balancesMap]);

  const chartData = useMemo(() => {
    const data: Array<{ month: string; monthLabel: string; projected: number; actual: number | null }> = [];
    const today = new Date();
    let cumulativeProjected = currentNetWorth;

    for (let i = 0; i <= 12; i++) {
      const monthDate = addMonths(today, i);
      const monthKey = format(monthDate, 'yyyy-MM-01');
      const monthLabel = format(monthDate, 'MMM');
      const validation = validations.find(v => v.month === monthKey);
      if (i > 0) cumulativeProjected = roundMoney(cumulativeProjected + monthlyNetBalance);

      data.push({
        month: monthKey,
        monthLabel,
        projected: cumulativeProjected,
        actual: validation?.validated_at ? roundMoney((validation.actual_total_income || 0) - (validation.actual_total_expenses || 0)) : null,
      });
    }
    return data;
  }, [validations, monthlyNetBalance, currentNetWorth]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-modal rounded-xl p-4 shadow-2xl">
          <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => entry.value !== null && (
            <p key={index} className="text-sm tabular-nums" style={{ color: entry.color }}>{entry.name}: {formatCurrency(entry.value, currency)}</p>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Smart Financing Calculator */}
      <SmartFinancingPanel
        totalRemaining={totalRemaining}
        projectEndDate={projectEndDate}
        currentMonthlyAllocation={monthlyAllocation}
      />

      {/* Balance Evolution Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="neu-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsla(200,100%,60%,0.15) 0%, hsla(200,100%,60%,0.05) 100%)', border: '1px solid hsla(200,100%,60%,0.25)', boxShadow: '0 0 20px hsla(200,100%,60%,0.15)' }}>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">{t('finance.projections.balanceEvolution')}</h3>
            <p className="text-sm text-muted-foreground">{t('finance.projections.monthProjection')}</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="monthLabel" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dy={8} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 0 ? '' : '-'}${Math.abs(value / 1000)}k`} dx={-8} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              {projectEndDate && <ReferenceLine x={format(projectEndDate, 'MMM')} stroke="hsl(var(--primary))" strokeDasharray="5 5" strokeOpacity={0.4} />}
              <Area type="monotone" dataKey="projected" name={t('finance.projections.projected')} stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#projectedGradient)" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="actual" name={t('finance.projections.actual')} stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 4, strokeWidth: 0 }} connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-5 h-[3px] bg-emerald-500 rounded-full" />
            <span className="text-sm text-muted-foreground">{t('finance.projections.actual')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-[3px] rounded-full" style={{ background: `repeating-linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)) 4px, transparent 4px, transparent 8px)` }} />
            <span className="text-sm text-muted-foreground">{t('finance.projections.projected')}</span>
          </div>
        </div>
      </motion.div>

      {/* Balance Summary Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className={`flex items-start gap-4 p-5 rounded-2xl border ${monthlyNetBalance >= 0 ? 'bg-emerald-500/[0.06] border-emerald-500/20 shadow-[0_0_30px_hsla(160,80%,50%,0.08)]' : 'bg-amber-500/[0.06] border-amber-500/20 shadow-[0_0_30px_hsla(40,90%,50%,0.08)]'}`}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${monthlyNetBalance >= 0 ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
          {monthlyNetBalance >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-400" /> : <TrendingDown className="h-5 w-5 text-amber-400" />}
        </div>
        <div>
          <p className={`text-base font-bold ${monthlyNetBalance >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {monthlyNetBalance >= 0 ? t('finance.projections.positiveBalance') : t('finance.projections.negativeBalance')}
          </p>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {monthlyNetBalance >= 0
              ? t('finance.projections.savingMessage', { amount: formatCurrency(monthlyNetBalance, currency), yearly: formatCurrency(monthlyNetBalance * 12, currency) })
              : t('finance.projections.spendingMessage', { amount: formatCurrency(Math.abs(monthlyNetBalance), currency) })
            }
          </p>
        </div>
      </motion.div>
    </div>
  );
}