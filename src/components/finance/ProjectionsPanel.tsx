import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { addMonths, format } from 'date-fns';
import { TrendingUp, TrendingDown, PieChart as PieChartIcon, BarChart3, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonthlyValidations, useRecurringExpenses } from '@/hooks/useFinance';
import { EXPENSE_CATEGORIES, getCategoryTotals } from '@/lib/financeCategories';

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
  const { data: recurringExpenses = [] } = useRecurringExpenses(user?.id);

  const monthlyNetBalance = totalRecurringIncome - totalRecurringExpenses;

  const chartData = useMemo(() => {
    const data: Array<{ month: string; monthLabel: string; projected: number; actual: number | null }> = [];
    const today = new Date();
    let cumulativeProjected = 0;

    for (let i = 0; i <= 12; i++) {
      const monthDate = addMonths(today, i);
      const monthKey = format(monthDate, 'yyyy-MM-01');
      const monthLabel = format(monthDate, 'MMM');
      const validation = validations.find(v => v.month === monthKey);
      cumulativeProjected += monthlyNetBalance;

      data.push({
        month: monthKey,
        monthLabel,
        projected: cumulativeProjected,
        actual: validation?.validated_at ? (validation.actual_total_income || 0) - (validation.actual_total_expenses || 0) : null,
      });
    }
    return data;
  }, [validations, monthlyNetBalance]);

  const categoryData = useMemo(() => getCategoryTotals(recurringExpenses, EXPENSE_CATEGORIES), [recurringExpenses]);

  const stats = useMemo(() => {
    const savingsRate = totalRecurringIncome > 0 ? ((totalRecurringIncome - totalRecurringExpenses) / totalRecurringIncome * 100) : 0;
    const monthsToGoal = monthlyAllocation > 0 ? Math.ceil(totalRemaining / monthlyAllocation) : null;
    return { savingsRate, monthsToGoal, monthlyNet: monthlyNetBalance, yearlyProjection: monthlyNetBalance * 12 };
  }, [totalRecurringIncome, totalRecurringExpenses, monthlyAllocation, totalRemaining, monthlyNetBalance]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-modal rounded-xl p-4 shadow-2xl">
          <p className="text-sm font-semibold text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => entry.value !== null && (
            <p key={index} className="text-sm tabular-nums" style={{ color: entry.color }}>{entry.name}: {formatCurrency(entry.value, currency)}</p>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-modal rounded-xl p-4 shadow-2xl">
          <p className="text-sm font-semibold text-white capitalize">{data.label}</p>
          <p className="text-lg font-bold tabular-nums" style={{ color: data.color }}>{formatCurrency(data.value, currency)}</p>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: t('finance.projections.savingsRate'), value: `${stats.savingsRate.toFixed(1)}%`, color: stats.savingsRate >= 0 ? 'text-emerald-400' : 'text-rose-400', iconColor: 'text-emerald-400' },
          { icon: BarChart3, label: t('finance.projections.monthlyNet'), value: `${stats.monthlyNet >= 0 ? '+' : ''}${formatCurrency(stats.monthlyNet, currency)}`, color: stats.monthlyNet >= 0 ? 'text-emerald-400' : 'text-rose-400', iconColor: 'text-primary' },
          { icon: TrendingUp, label: t('finance.projections.yearly'), value: `${stats.yearlyProjection >= 0 ? '+' : ''}${formatCurrency(stats.yearlyProjection, currency)}`, color: stats.yearlyProjection >= 0 ? 'text-emerald-400' : 'text-rose-400', iconColor: 'text-primary' },
          { icon: Target, label: t('finance.projections.toGoal'), value: stats.monthsToGoal !== null ? `${stats.monthsToGoal} mo` : '—', color: 'text-white', iconColor: 'text-primary' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="neu-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 neu-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsla(200,100%,60%,0.15) 0%, hsla(200,100%,60%,0.05) 100%)', border: '1px solid hsla(200,100%,60%,0.25)', boxShadow: '0 0 20px hsla(200,100%,60%,0.15)' }}>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">{t('finance.projections.balanceEvolution')}</h3>
              <p className="text-sm text-slate-500">{t('finance.projections.monthProjection')}</p>
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.06)" vertical={false} />
                <XAxis dataKey="monthLabel" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 0 ? '' : '-'}${Math.abs(value / 1000)}k`} dx={-8} />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                {projectEndDate && <ReferenceLine x={format(projectEndDate, 'MMM')} stroke="hsl(var(--primary))" strokeDasharray="5 5" strokeOpacity={0.4} />}
                <Area type="monotone" dataKey="projected" name={t('finance.projections.projected')} stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#projectedGradient)" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="actual" name={t('finance.projections.actual')} stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 4, strokeWidth: 0 }} connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-[3px] bg-emerald-500 rounded-full" />
              <span className="text-sm text-slate-400">{t('finance.projections.actual')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-[3px] rounded-full" style={{ background: `repeating-linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)) 4px, transparent 4px, transparent 8px)` }} />
              <span className="text-sm text-slate-400">{t('finance.projections.projected')}</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="neu-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsla(350,80%,60%,0.15) 0%, hsla(350,80%,60%,0.05) 100%)', border: '1px solid hsla(350,80%,60%,0.25)', boxShadow: '0 0 20px hsla(350,80%,60%,0.15)' }}>
              <PieChartIcon className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">{t('finance.projections.expenseDistribution')}</h3>
              <p className="text-sm text-slate-500">{t('finance.projections.byCategory')}</p>
            </div>
          </div>
          {categoryData.length > 0 ? (
            <>
              <div className="flex items-center justify-center mb-6">
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {categoryData.map((entry, index) => (
                          <linearGradient key={`pie-gradient-${index}`} id={`pie-gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value" animationBegin={300} animationDuration={800}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#pie-gradient-${index})`} stroke={entry.color} strokeWidth={1} strokeOpacity={0.3} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-2">
                {categoryData.slice(0, 6).map((cat, i) => {
                  const Icon = cat.icon;
                  return (
                    <motion.div key={cat.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}15`, boxShadow: `0 0 12px ${cat.color}20` }}>
                        <Icon className="h-4 w-4" style={{ color: cat.color }} />
                      </div>
                      <span className="text-sm text-slate-300 capitalize flex-1">{cat.label}</span>
                      <span className="text-sm font-bold text-white tabular-nums">{formatCurrency(cat.value, currency)}</span>
                    </motion.div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl neu-inset flex items-center justify-center mb-4">
                <PieChartIcon className="h-8 w-8 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 font-medium">{t('finance.projections.noExpenseData')}</p>
              <p className="text-xs text-slate-600 mt-1">{t('finance.projections.addExpensesHint')}</p>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className={`flex items-start gap-4 p-5 rounded-2xl border ${monthlyNetBalance >= 0 ? 'bg-emerald-500/[0.06] border-emerald-500/20 shadow-[0_0_30px_hsla(160,80%,50%,0.08)]' : 'bg-amber-500/[0.06] border-amber-500/20 shadow-[0_0_30px_hsla(40,90%,50%,0.08)]'}`}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${monthlyNetBalance >= 0 ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
          {monthlyNetBalance >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-400" /> : <TrendingDown className="h-5 w-5 text-amber-400" />}
        </div>
        <div>
          <p className={`text-base font-bold ${monthlyNetBalance >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {monthlyNetBalance >= 0 ? t('finance.projections.positiveBalance') : t('finance.projections.negativeBalance')}
          </p>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
            {monthlyNetBalance >= 0
              ? t('finance.projections.savingMessage', { amount: formatCurrency(monthlyNetBalance, currency), yearly: formatCurrency(stats.yearlyProjection, currency) })
              : t('finance.projections.spendingMessage', { amount: formatCurrency(Math.abs(monthlyNetBalance), currency) })
            }
          </p>
        </div>
      </motion.div>
    </div>
  );
}
