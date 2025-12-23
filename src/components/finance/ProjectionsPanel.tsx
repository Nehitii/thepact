import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell } from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { addMonths, format } from 'date-fns';
import { TrendingUp, TrendingDown, Info, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonthlyValidations, useRecurringExpenses } from '@/hooks/useFinance';

interface ProjectionsPanelProps {
  projectEndDate: Date | null;
  monthlyAllocation: number;
  totalRemaining: number;
  totalRecurringExpenses: number;
  totalRecurringIncome: number;
}

const CATEGORY_COLORS = {
  housing: '#ef4444',
  transport: '#f97316',
  food: '#eab308',
  utilities: '#84cc16',
  health: '#22c55e',
  shopping: '#14b8a6',
  entertainment: '#06b6d4',
  other: '#8b5cf6',
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

  // Category distribution for expenses
  const categoryData = useMemo(() => {
    // For now, use simplified category distribution based on expense names
    const categories: Record<string, number> = {};
    
    recurringExpenses.filter(e => e.is_active).forEach(expense => {
      const category = 'other'; // Would need category field in DB
      categories[category] = (categories[category] || 0) + expense.amount;
    });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] || '#8b5cf6',
    }));
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
        <div className="bg-card/95 backdrop-blur-xl border border-white/[0.1] rounded-xl p-3 shadow-xl">
          <p className="text-xs font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            entry.value !== null && (
              <p key={index} className="text-xs" style={{ color: entry.color }}>
                {entry.name}: {formatCurrency(entry.value, currency)}
              </p>
            )
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/[0.08] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Savings Rate</span>
          </div>
          <p className={`text-2xl font-semibold tabular-nums ${stats.savingsRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.savingsRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/[0.08] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Monthly Net</span>
          </div>
          <p className={`text-2xl font-semibold tabular-nums ${stats.monthlyNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.monthlyNet >= 0 ? '+' : ''}{formatCurrency(stats.monthlyNet, currency)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/[0.08] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Yearly Projection</span>
          </div>
          <p className={`text-2xl font-semibold tabular-nums ${stats.yearlyProjection >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.yearlyProjection >= 0 ? '+' : ''}{formatCurrency(stats.yearlyProjection, currency)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/[0.08] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Months to Goal</span>
          </div>
          <p className="text-2xl font-semibold text-foreground tabular-nums">
            {stats.monthsToGoal !== null ? stats.monthsToGoal : '—'}
          </p>
        </div>
      </div>

      {/* Balance Evolution Chart */}
      <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Balance Evolution</h3>
            <p className="text-xs text-muted-foreground">12-month projection</p>
          </div>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.1)" />
              <XAxis 
                dataKey="monthLabel" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value >= 0 ? '' : '-'}${Math.abs(value / 1000)}k`}
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
              
              <Line
                type="monotone"
                dataKey="projected"
                name="Projected"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
              
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ fill: '#22c55e', r: 3, strokeWidth: 0 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-emerald-500 rounded-full" />
            <span className="text-xs text-muted-foreground">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-primary rounded-full" style={{ background: `repeating-linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)) 4px, transparent 4px, transparent 8px)` }} />
            <span className="text-xs text-muted-foreground">Projected</span>
          </div>
        </div>
      </div>

      {/* Expense Distribution */}
      {categoryData.length > 0 && (
        <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <PieChartIcon className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Expense Distribution</h3>
              <p className="text-xs text-muted-foreground">By category</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value, currency)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color }} />
                <span className="text-xs text-muted-foreground capitalize">{cat.name}</span>
                <span className="text-xs font-medium text-foreground ml-auto tabular-nums">
                  {formatCurrency(cat.value, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insight Card */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${
        monthlyNetBalance >= 0 
          ? 'bg-emerald-500/[0.05] border-emerald-500/[0.15]' 
          : 'bg-amber-500/[0.05] border-amber-500/[0.15]'
      }`}>
        {monthlyNetBalance >= 0 ? (
          <TrendingUp className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <TrendingDown className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        )}
        <div>
          <p className={`text-sm font-medium ${monthlyNetBalance >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {monthlyNetBalance >= 0 
              ? 'Positive monthly balance'
              : 'Negative monthly balance'
            }
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {monthlyNetBalance >= 0 
              ? `At this rate, you'll save ${formatCurrency(stats.yearlyProjection, currency)} this year.`
              : `You're spending ${formatCurrency(Math.abs(monthlyNetBalance), currency)} more than you earn monthly.`
            }
          </p>
        </div>
      </div>
    </div>
  );
}