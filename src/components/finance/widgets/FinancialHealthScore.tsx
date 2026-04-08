import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, Target, CalendarCheck, ArrowUpDown } from 'lucide-react';
import { roundMoney } from '@/lib/financeCategories';
import type { MonthlyValidation, FinancialItem } from '@/types/finance';
import type { CategoryBudget } from '@/hooks/useBudgets';

interface FinancialHealthScoreProps {
  totalIncome: number;
  totalExpenses: number;
  validations: MonthlyValidation[];
  budgets: CategoryBudget[];
  monthTransactionsByCategory: Record<string, number>;
  incomeCategories: number;
}

interface ScoreBreakdown {
  label: string;
  score: number;
  max: number;
  icon: typeof ShieldCheck;
  color: string;
}

export function FinancialHealthScore({
  totalIncome,
  totalExpenses,
  validations,
  budgets,
  monthTransactionsByCategory,
  incomeCategories,
}: FinancialHealthScoreProps) {
  const { t } = useTranslation();

  const { totalScore, breakdown } = useMemo(() => {
    const items: ScoreBreakdown[] = [];

    // 1. Savings rate (0-30 pts)
    const monthlyNet = roundMoney(totalIncome - totalExpenses);
    const savingsRate = totalIncome > 0 ? (monthlyNet / totalIncome) * 100 : 0;
    const savingsScore = Math.min(30, Math.max(0, Math.round(savingsRate * 1.5)));
    items.push({
      label: t('finance.healthScore.savingsRate'),
      score: savingsScore,
      max: 30,
      icon: TrendingUp,
      color: '#34d399',
    });

    // 2. Budget compliance (0-25 pts)
    let budgetScore = 25;
    if (budgets.length > 0) {
      let overCount = 0;
      budgets.forEach(b => {
        const spent = monthTransactionsByCategory[b.category] || 0;
        if (spent > b.monthly_limit) overCount++;
      });
      const compliance = 1 - overCount / budgets.length;
      budgetScore = Math.round(compliance * 25);
    }
    items.push({
      label: t('finance.healthScore.budgetCompliance'),
      score: budgetScore,
      max: 25,
      icon: Target,
      color: '#fbbf24',
    });

    // 3. Validation streak (0-25 pts) — consecutive validated months
    const sorted = [...validations]
      .filter(v => v.validated_at)
      .sort((a, b) => b.month.localeCompare(a.month));
    const validationStreak = sorted.length;
    const validationScore = Math.min(25, validationStreak * 4);
    items.push({
      label: t('finance.healthScore.validationStreak'),
      score: validationScore,
      max: 25,
      icon: CalendarCheck,
      color: '#60a5fa',
    });

    // 4. Income diversification (0-20 pts)
    const diversScore = Math.min(20, incomeCategories * 5);
    items.push({
      label: t('finance.healthScore.diversification'),
      score: diversScore,
      max: 20,
      icon: ArrowUpDown,
      color: '#c084fc',
    });

    const total = items.reduce((s, i) => s + i.score, 0);
    return { totalScore: total, breakdown: items };
  }, [totalIncome, totalExpenses, validations, budgets, monthTransactionsByCategory, incomeCategories, t]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#34d399';
    if (score >= 60) return '#fbbf24';
    if (score >= 40) return '#fb923c';
    return '#fb7185';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return t('finance.healthScore.excellent');
    if (score >= 60) return t('finance.healthScore.good');
    if (score >= 40) return t('finance.healthScore.average');
    return t('finance.healthScore.needsWork');
  };

  const scoreColor = getScoreColor(totalScore);
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="neu-card p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${scoreColor}15`, border: `1px solid ${scoreColor}40` }}
        >
          <ShieldCheck className="w-5 h-5" style={{ color: scoreColor }} />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">{t('finance.healthScore.title')}</h3>
          <p className="text-xs text-muted-foreground">{t('finance.healthScore.subtitle')}</p>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-6">
        {/* Gauge */}
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted)/0.15)" strokeWidth="6" />
            <motion.circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={scoreColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black tabular-nums" style={{ color: scoreColor }}>{totalScore}</span>
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">/100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold mb-1" style={{ color: scoreColor }}>{getScoreLabel(totalScore)}</p>
          <div className="space-y-2">
            {breakdown.map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className="w-3 h-3 shrink-0" style={{ color: item.color }} />
                <span className="text-[11px] text-muted-foreground flex-1 truncate">{item.label}</span>
                <span className="text-[11px] font-bold tabular-nums text-foreground">{item.score}/{item.max}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
