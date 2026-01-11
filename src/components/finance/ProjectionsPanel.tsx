import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { addMonths, format } from 'date-fns';
import { TrendingUp, TrendingDown, Info, PieChart as PieChartIcon, BarChart3, Target, 
  Home, Car, Utensils, Wifi, Heart, ShoppingBag, Zap, PiggyBank, Landmark, GraduationCap, 
  Gamepad2, Wrench, CreditCard, Receipt, Plane } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonthlyValidations, useRecurringExpenses } from '@/hooks/useFinance';

interface ProjectionsPanelProps {
  projectEndDate: Date | null;
  monthlyAllocation: number;
  totalRemaining: number;
  totalRecurringExpenses: number;
  totalRecurringIncome: number;
}

// Category config matching MonthlySection
const CATEGORY_CONFIG: Record<string, { icon: typeof Home; color: string; chartColor: string }> = {
  housing: { icon: Home, color: 'text-rose-400', chartColor: '#f43f5e' },
  utilities: { icon: Wifi, color: 'text-orange-400', chartColor: '#f97316' },
  food: { icon: Utensils, color: 'text-yellow-400', chartColor: '#eab308' },
  transport: { icon: Car, color: 'text-blue-400', chartColor: '#3b82f6' },
  subscriptions: { icon: CreditCard, color: 'text-purple-400', chartColor: '#a855f7' },
  health: { icon: Heart, color: 'text-pink-400', chartColor: '#ec4899' },
  leisure: { icon: Gamepad2, color: 'text-cyan-400', chartColor: '#06b6d4' },
  savings: { icon: PiggyBank, color: 'text-emerald-400', chartColor: '#10b981' },
  investments: { icon: TrendingUp, color: 'text-green-400', chartColor: '#22c55e' },
  taxes: { icon: Landmark, color: 'text-red-400', chartColor: '#ef4444' },
  education: { icon: GraduationCap, color: 'text-indigo-400', chartColor: '#6366f1' },
  travel: { icon: Plane, color: 'text-sky-400', chartColor: '#0ea5e9' },
  shopping: { icon: ShoppingBag, color: 'text-violet-400', chartColor: '#8b5cf6' },
  maintenance: { icon: Wrench, color: 'text-amber-400', chartColor: '#f59e0b' },
  miscellaneous: { icon: Receipt, color: 'text-slate-400', chartColor: '#64748b' },
  other: { icon: Receipt, color: 'text-slate-400', chartColor: '#64748b' },
};

export function ProjectionsPanel({
  projectEndDate,
  monthlyAllocation,
  totalRemaining,
  totalRecurringExpenses,
  totalRecurringIncome,
}: ProjectionsPanelProps) {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: validations = [] } = useMonthlyValidations(user?.id);
  const { data: recurringExpenses = [] } = useRecurringExpenses(user?.id);

  const monthlyNetBalance = totalRecurringIncome - totalRecurringExpenses;

  // Generate projection data
  const chartData = useMemo(() => {
    const data: Array<{
      month: string;
      monthLabel: string;
      projected: number;
      actual: number | null;
    }> = [];

    const today = new Date();
    const monthsToProject = 12;
    let cumulativeProjected = 0;

    for (let i = 0; i <= monthsToProject; i++) {
      const monthDate = addMonths(today, i);
      const monthKey = format(monthDate, 'yyyy-MM-01');
      const monthLabel = format(monthDate, 'MMM');

      const validation = validations.find(v => v.month === monthKey);
      
      cumulativeProjected += monthlyNetBalance;

      data.push({
        month: monthKey,
        monthLabel,
        projected: cumulativeProjected,
        actual: validation?.validated_at 
          ? (validation.actual_total_income || 0) - (validation.actual_total_expenses || 0)
          : null,
      });
    }

    return data;
  }, [validations, monthlyNetBalance]);

  // Category distribution for expenses - using names to categorize
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    
    recurringExpenses.filter(e => e.is_active).forEach(expense => {
      // Simple category detection from name
      const name = expense.name.toLowerCase();
      let category = 'miscellaneous';
      
      if (name.includes('rent') || name.includes('mortgage') || name.includes('housing') || name.includes('loyer')) {
        category = 'housing';
      } else if (name.includes('electric') || name.includes('gas') || name.includes('water') || name.includes('internet') || name.includes('phone')) {
        category = 'utilities';
      } else if (name.includes('grocery') || name.includes('food') || name.includes('restaurant')) {
        category = 'food';
      } else if (name.includes('car') || name.includes('fuel') || name.includes('transport') || name.includes('metro') || name.includes('bus')) {
        category = 'transport';
      } else if (name.includes('netflix') || name.includes('spotify') || name.includes('subscription') || name.includes('abonnement')) {
        category = 'subscriptions';
      } else if (name.includes('gym') || name.includes('health') || name.includes('doctor') || name.includes('insurance') || name.includes('mutuelle')) {
        category = 'health';
      } else if (name.includes('save') || name.includes('saving') || name.includes('épargne')) {
        category = 'savings';
      } else if (name.includes('invest') || name.includes('stock')) {
        category = 'investments';
      } else if (name.includes('tax') || name.includes('impôt')) {
        category = 'taxes';
      }
      
      categories[category] = (categories[category] || 0) + expense.amount;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({
        name,
        label: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: CATEGORY_CONFIG[name]?.chartColor || '#64748b',
        icon: CATEGORY_CONFIG[name]?.icon || Receipt,
      }))
      .sort((a, b) => b.value - a.value);
  }, [recurringExpenses]);

  // Stats summary
  const stats = useMemo(() => {
    const savingsRate = totalRecurringIncome > 0 
      ? ((totalRecurringIncome - totalRecurringExpenses) / totalRecurringIncome * 100)
      : 0;
    
    const monthsToGoal = monthlyAllocation > 0 
      ? Math.ceil(totalRemaining / monthlyAllocation)
      : null;

    return {
      savingsRate,
      monthsToGoal,
      monthlyNet: monthlyNetBalance,
      yearlyProjection: monthlyNetBalance * 12,
    };
  }, [totalRecurringIncome, totalRecurringExpenses, monthlyAllocation, totalRemaining, monthlyNetBalance]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0d1220]/95 backdrop-blur-xl border border-white/[0.1] rounded-xl p-4 shadow-2xl">
          <p className="text-sm font-medium text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            entry.value !== null && (
              <p key={index} className="text-sm tabular-nums" style={{ color: entry.color }}>
                {entry.name}: {formatCurrency(entry.value, currency)}
              </p>
            )
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0d1220]/95 backdrop-blur-xl border border-white/[0.1] rounded-xl p-4 shadow-2xl">
          <p className="text-sm font-medium text-white capitalize">{data.name}</p>
          <p className="text-lg font-semibold tabular-nums" style={{ color: data.color }}>
            {formatCurrency(data.value, currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="finance-stat-card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Savings Rate</span>
          </div>
          <p className={`text-2xl sm:text-3xl font-semibold tabular-nums ${stats.savingsRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.savingsRate.toFixed(1)}%
          </p>
        </div>

        <div className="finance-stat-card">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Monthly Net</span>
          </div>
          <p className={`text-2xl sm:text-3xl font-semibold tabular-nums ${stats.monthlyNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.monthlyNet >= 0 ? '+' : ''}{formatCurrency(stats.monthlyNet, currency)}
          </p>
        </div>

        <div className="finance-stat-card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Yearly</span>
          </div>
          <p className={`text-2xl sm:text-3xl font-semibold tabular-nums ${stats.yearlyProjection >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.yearlyProjection >= 0 ? '+' : ''}{formatCurrency(stats.yearlyProjection, currency)}
          </p>
        </div>

        <div className="finance-stat-card">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">To Goal</span>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-white tabular-nums">
            {stats.monthsToGoal !== null ? (
              <>{stats.monthsToGoal} <span className="text-sm text-slate-500">mo</span></>
            ) : '—'}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Evolution Chart */}
        <div className="lg:col-span-2 finance-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white tracking-tight">Balance Evolution</h3>
              <p className="text-sm text-slate-500">12-month projection</p>
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                <XAxis 
                  dataKey="monthLabel" 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value >= 0 ? '' : '-'}${Math.abs(value / 1000)}k`}
                  dx={-8}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {projectEndDate && (
                  <ReferenceLine 
                    x={format(projectEndDate, 'MMM')} 
                    stroke="hsl(var(--primary))"
                    strokeDasharray="5 5"
                    strokeOpacity={0.5}
                  />
                )}
                
                <Area
                  type="monotone"
                  dataKey="projected"
                  name="Projected"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#projectedGradient)"
                  strokeDasharray="5 5"
                />
                
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ fill: '#22c55e', r: 4, strokeWidth: 0 }}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-[3px] bg-emerald-500 rounded-full" />
              <span className="text-sm text-slate-400">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-[3px] rounded-full" style={{ 
                background: `repeating-linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)) 4px, transparent 4px, transparent 8px)` 
              }} />
              <span className="text-sm text-slate-400">Projected</span>
            </div>
          </div>
        </div>

        {/* Expense Distribution */}
        <div className="finance-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <PieChartIcon className="h-6 w-6 text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white tracking-tight">Expenses</h3>
              <p className="text-sm text-slate-500">By category</p>
            </div>
          </div>

          {categoryData.length > 0 ? (
            <>
              <div className="flex items-center justify-center mb-6">
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Legend */}
              <div className="space-y-2">
                {categoryData.slice(0, 6).map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div key={cat.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                        <Icon className="h-4 w-4" style={{ color: cat.color }} />
                      </div>
                      <span className="text-sm text-slate-300 capitalize flex-1">{cat.name}</span>
                      <span className="text-sm font-semibold text-white tabular-nums">
                        {formatCurrency(cat.value, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PieChartIcon className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-sm text-slate-500">No expense data yet</p>
              <p className="text-xs text-slate-600 mt-1">Add recurring expenses to see distribution</p>
            </div>
          )}
        </div>
      </div>

      {/* Insight Card */}
      <div className={`flex items-start gap-4 p-5 rounded-2xl border ${
        monthlyNetBalance >= 0 
          ? 'bg-emerald-500/[0.04] border-emerald-500/[0.15]' 
          : 'bg-amber-500/[0.04] border-amber-500/[0.15]'
      }`}>
        {monthlyNetBalance >= 0 ? (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <TrendingDown className="h-5 w-5 text-amber-400" />
          </div>
        )}
        <div>
          <p className={`text-base font-semibold ${monthlyNetBalance >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {monthlyNetBalance >= 0 
              ? 'Positive monthly balance'
              : 'Negative monthly balance'
            }
          </p>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
            {monthlyNetBalance >= 0 
              ? `At this rate, you'll save ${formatCurrency(stats.yearlyProjection, currency)} this year. Keep it up!`
              : `You're spending ${formatCurrency(Math.abs(monthlyNetBalance), currency)} more than you earn monthly. Consider reviewing your expenses.`
            }
          </p>
        </div>
      </div>
    </div>
  );
}
