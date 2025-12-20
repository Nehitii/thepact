import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { addMonths, format, parseISO, isBefore } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonthlyValidations, useRecurringExpenses, useRecurringIncome } from '@/hooks/useFinance';

interface ProjectionsChartProps {
  projectEndDate: Date | null;
  monthlyAllocation: number;
  totalRemaining: number;
}

export function ProjectionsChart({
  projectEndDate,
  monthlyAllocation,
  totalRemaining,
}: ProjectionsChartProps) {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: validations = [] } = useMonthlyValidations(user?.id);
  const { data: recurringExpenses = [] } = useRecurringExpenses(user?.id);
  const { data: recurringIncome = [] } = useRecurringIncome(user?.id);

  const totalRecurringExpenses = recurringExpenses
    .filter(e => e.is_active)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalRecurringIncome = recurringIncome
    .filter(i => i.is_active)
    .reduce((sum, i) => sum + i.amount, 0);

  const monthlyNetBalance = totalRecurringIncome - totalRecurringExpenses;

  // Generate projection data
  const chartData = useMemo(() => {
    const data: Array<{
      month: string;
      monthLabel: string;
      projected: number;
      real: number | null;
      isDeadline?: boolean;
    }> = [];

    const today = new Date();
    const monthsToProject = 12;
    let projectedBalance = 0;
    let realBalance = 0;

    for (let i = 0; i <= monthsToProject; i++) {
      const monthDate = addMonths(today, i);
      const monthKey = format(monthDate, 'yyyy-MM-01');
      const monthLabel = format(monthDate, 'MMM yy');

      // Check if we have real validation data for this month
      const validation = validations.find(v => v.month === monthKey);
      
      if (validation && validation.validated_at) {
        // Use real data
        realBalance = validation.actual_total_income - validation.actual_total_expenses;
      } else {
        // No real data for future months
        realBalance = i === 0 ? 0 : NaN;
      }

      // Projected balance based on recurring data
      projectedBalance = monthlyNetBalance * (i + 1);

      const isDeadlineMonth = projectEndDate && 
        format(monthDate, 'yyyy-MM') === format(projectEndDate, 'yyyy-MM');

      data.push({
        month: monthKey,
        monthLabel,
        projected: projectedBalance,
        real: isNaN(realBalance) ? null : realBalance,
        isDeadline: isDeadlineMonth,
      });
    }

    return data;
  }, [validations, monthlyNetBalance, projectEndDate]);

  // Calculate interpretation
  const interpretation = useMemo(() => {
    const hasRealData = chartData.some(d => d.real !== null);
    const lastRealData = chartData.filter(d => d.real !== null).pop();
    const correspondingProjected = lastRealData 
      ? chartData.find(d => d.month === lastRealData.month)?.projected 
      : null;

    if (!hasRealData) {
      return {
        type: 'neutral' as const,
        message: "Here is your projected evolution over the next 12 months if your income and expenses remain the same.",
        icon: Info,
      };
    }

    if (lastRealData && correspondingProjected !== null) {
      if (lastRealData.real! > correspondingProjected) {
        return {
          type: 'positive' as const,
          message: "You are performing better than your initial projection.",
          icon: TrendingUp,
        };
      } else if (lastRealData.real! < correspondingProjected) {
        return {
          type: 'negative' as const,
          message: "Based on real data, you are currently behind your projection.",
          icon: TrendingDown,
        };
      }
    }

    const monthsToStabilize = monthlyNetBalance !== 0 
      ? Math.abs(Math.ceil(totalRemaining / monthlyNetBalance))
      : null;

    return {
      type: 'neutral' as const,
      message: monthsToStabilize 
        ? `If nothing changes, your balance will stabilize in ${monthsToStabilize} months.`
        : "Add recurring income and expenses to see projections.",
      icon: Minus,
    };
  }, [chartData, monthlyNetBalance, totalRemaining]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-xl border border-primary/30 rounded-lg p-3 shadow-lg">
          <p className="font-orbitron text-xs text-primary mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs font-rajdhani" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value, currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-primary/5 rounded-xl blur-2xl opacity-50" />
      <div className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/40 rounded-xl p-6 overflow-hidden">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-orbitron font-bold text-primary tracking-wider mb-1">
            FINANCIAL PROJECTIONS
          </h3>
          <p className="text-sm text-muted-foreground font-rajdhani">
            Real vs projected balance evolution
          </p>
        </div>

        {/* Chart */}
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.1)" />
              <XAxis 
                dataKey="monthLabel" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                fontFamily="Rajdhani"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                fontFamily="Orbitron"
                tickFormatter={(value) => `${value >= 0 ? '' : '-'}${Math.abs(value / 1000)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Deadline line */}
              {projectEndDate && (
                <ReferenceLine 
                  x={format(projectEndDate, 'MMM yy')} 
                  stroke="hsl(var(--accent))"
                  strokeDasharray="5 5"
                  label={{ 
                    value: 'Deadline', 
                    position: 'top',
                    fill: 'hsl(var(--accent))',
                    fontSize: 10,
                    fontFamily: 'Rajdhani'
                  }}
                />
              )}
              
              {/* Projected line */}
              <Line
                type="monotone"
                dataKey="projected"
                name="Projected"
                stroke="hsl(200 100% 67%)"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
              
              {/* Real line */}
              <Line
                type="monotone"
                dataKey="real"
                name="Real"
                stroke="hsl(0 0% 95%)"
                strokeWidth={3}
                dot={{ fill: 'hsl(0 0% 95%)', r: 4 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-white" />
            <span className="text-xs font-rajdhani text-muted-foreground">Real Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-primary border-dashed" style={{ borderTopWidth: '2px', borderTopStyle: 'dashed' }} />
            <span className="text-xs font-rajdhani text-muted-foreground">Projected</span>
          </div>
          {projectEndDate && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-accent" style={{ borderTopWidth: '2px', borderTopStyle: 'dashed' }} />
              <span className="text-xs font-rajdhani text-muted-foreground">Deadline</span>
            </div>
          )}
        </div>

        {/* Interpretation */}
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${
          interpretation.type === 'positive' 
            ? 'bg-green-500/10 border-green-500/30' 
            : interpretation.type === 'negative'
            ? 'bg-orange-500/10 border-orange-500/30'
            : 'bg-primary/10 border-primary/30'
        }`}>
          <interpretation.icon className={`h-5 w-5 ${
            interpretation.type === 'positive' 
              ? 'text-green-400' 
              : interpretation.type === 'negative'
              ? 'text-orange-400'
              : 'text-primary'
          }`} />
          <p className={`text-sm font-rajdhani ${
            interpretation.type === 'positive' 
              ? 'text-green-400' 
              : interpretation.type === 'negative'
              ? 'text-orange-400'
              : 'text-primary/80'
          }`}>
            {interpretation.message}
          </p>
        </div>
      </div>
    </div>
  );
}
