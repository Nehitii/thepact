import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import type { MonthlyValidation } from '@/types/finance';
import { format, subMonths } from 'date-fns';

interface CategoryTrendsChartProps {
  validations: MonthlyValidation[];
  currency: string;
}

export function CategoryTrendsChart({ validations, currency }: CategoryTrendsChartProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    const now = new Date();
    const months: Array<{ month: string; label: string; income: number; expenses: number; net: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, 'yyyy-MM');
      const label = format(d, 'MMM');
      const v = validations.find(val => val.month === key && val.validated_at);
      months.push({
        month: key,
        label,
        income: v ? (v.actual_total_income || 0) : 0,
        expenses: v ? (v.actual_total_expenses || 0) : 0,
        net: v ? (v.actual_total_income || 0) - (v.actual_total_expenses || 0) : 0,
      });
    }
    return months;
  }, [validations]);

  const hasData = chartData.some(d => d.income > 0 || d.expenses > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-modal rounded-xl p-3 shadow-2xl">
          <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs tabular-nums" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value, currency)}
            </p>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="neu-card p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">{t('finance.analytics.incomeVsExpenses')}</h3>
          <p className="text-xs text-muted-foreground">{t('finance.analytics.last6Months')}</p>
        </div>
      </div>

      {!hasData ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t('finance.monthly.notEnoughData')}</p>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Line type="monotone" dataKey="income" name={t('finance.monthly.income')} stroke="#34d399" strokeWidth={2.5} dot={{ r: 3, fill: '#34d399' }} />
              <Line type="monotone" dataKey="expenses" name={t('finance.monthly.expenses')} stroke="#fb7185" strokeWidth={2.5} dot={{ r: 3, fill: '#fb7185' }} />
              <Line type="monotone" dataKey="net" name={t('finance.projections.monthlyNet')} stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-2"><div className="w-4 h-[3px] rounded-full bg-emerald-400" /><span className="text-xs text-muted-foreground">{t('finance.monthly.income')}</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-[3px] rounded-full bg-rose-400" /><span className="text-xs text-muted-foreground">{t('finance.monthly.expenses')}</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-[3px] rounded-full" style={{ background: 'repeating-linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)) 3px, transparent 3px, transparent 6px)' }} /><span className="text-xs text-muted-foreground">Net</span></div>
      </div>
    </motion.div>
  );
}
