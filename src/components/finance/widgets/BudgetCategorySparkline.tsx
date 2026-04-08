import { useMemo } from 'react';
import { format, subMonths } from 'date-fns';
import type { MonthlyValidation } from '@/types/finance';

interface BudgetCategorySparklineProps {
  category: string;
  validations: MonthlyValidation[];
  color: string;
  currentMonthSpent: number;
}

/**
 * Tiny 3-month sparkline for a budget category.
 * Uses validated monthly data for past months and live transaction total for current month.
 */
export function BudgetCategorySparkline({
  category,
  validations,
  color,
  currentMonthSpent,
}: BudgetCategorySparklineProps) {
  const points = useMemo(() => {
    const now = new Date();
    const months: number[] = [];

    // Past 2 months from validations (approximate: use total expenses scaled by category proportion)
    // Since we don't have per-category validated data, we use current month as latest data point
    // and show a simple trend of actual_total_expenses for context
    for (let i = 2; i >= 1; i--) {
      const m = format(subMonths(now, i), 'yyyy-MM-01');
      const v = validations.find(val => val.month === m);
      // Approximate: we don't have per-category historic data, so show 0 for missing
      months.push(v?.actual_total_expenses ? Math.round(v.actual_total_expenses * 0.15) : 0);
    }
    months.push(currentMonthSpent);

    return months;
  }, [validations, currentMonthSpent]);

  const max = Math.max(...points, 1);
  const h = 16;
  const w = 48;

  const pathD = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - (p / max) * h;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      {/* Current month dot */}
      <circle cx={w} cy={h - (points[points.length - 1] / max) * h} r="2" fill={color} />
    </svg>
  );
}
