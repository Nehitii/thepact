import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { type FinanceCategory, getCategoryLabel, getCategoryTotals } from '@/lib/financeCategories';
import type { CategoryBudget } from '@/hooks/useBudgets';
import type { FinancialItem } from '@/types/finance';

interface BudgetProgressPanelProps {
  budgets: CategoryBudget[];
  expenseItems: FinancialItem[];
  categories: FinanceCategory[];
  currency: string;
  onUpsert: (budget: { category: string; budget_type: string; monthly_limit: number }) => Promise<void>;
  onDelete: (id: string) => void;
  isPending?: boolean;
}

export function BudgetProgressPanel({
  budgets,
  expenseItems,
  categories,
  currency,
  onUpsert,
  onDelete,
  isPending,
}: BudgetProgressPanelProps) {
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');

  const categoryTotals = getCategoryTotals(expenseItems, categories, t);
  const spendingByCategory: Record<string, number> = {};
  categoryTotals.forEach(ct => { spendingByCategory[ct.name] = ct.value; });

  const availableCategories = categories.filter(
    c => !budgets.some(b => b.category === c.value)
  );

  const handleAdd = async () => {
    if (!newCategory || !newLimit) return;
    await onUpsert({ category: newCategory, budget_type: 'expense', monthly_limit: parseFloat(newLimit) });
    setNewCategory('');
    setNewLimit('');
    setShowAdd(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="neu-card overflow-hidden"
    >
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsla(30,90%,55%,0.15), hsla(30,90%,55%,0.05))', border: '1px solid hsla(30,90%,55%,0.25)' }}>
            <Target className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{t('finance.budgets.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('finance.budgets.subtitle')}</p>
          </div>
        </div>
        {availableCategories.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className="rounded-xl border-border">
            <Plus className="w-4 h-4 mr-1" />{t('common.add')}
          </Button>
        )}
      </div>

      <div className="px-6 pb-6 space-y-4">
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="neu-inset rounded-xl p-4 space-y-3"
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="w-full sm:w-[180px] h-11 bg-muted dark:bg-slate-800/60 border-border rounded-lg">
                    <SelectValue placeholder={t('finance.recurring.category')} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border rounded-xl">
                    {availableCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value} className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <cat.icon className="w-3.5 h-3.5" style={{ color: cat.hexColor }} />
                          <span>{getCategoryLabel(cat, t)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{getCurrencySymbol(currency)}</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={newLimit}
                    onChange={e => setNewLimit(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder={t('finance.budgets.limitPlaceholder')}
                    className="h-11 pl-7 finance-input rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
                <Button size="sm" onClick={handleAdd} disabled={!newCategory || !newLimit || isPending}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400">
                  <Plus className="w-4 h-4 mr-1" />{t('common.add')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {budgets.length === 0 && !showAdd ? (
          <div className="text-center py-8">
            <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t('finance.budgets.empty')}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{t('finance.budgets.emptyHint')}</p>
          </div>
        ) : (
          budgets.map((budget, i) => {
            const cat = categories.find(c => c.value === budget.category);
            const spent = spendingByCategory[budget.category] || 0;
            const percentage = budget.monthly_limit > 0 ? (spent / budget.monthly_limit) * 100 : 0;
            const isOver = percentage > 100;
            const isWarning = percentage >= 80 && percentage <= 100;
            const Icon = cat?.icon;

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl neu-inset"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4" style={{ color: cat?.hexColor }} />}
                    <span className="text-sm font-semibold text-foreground">{cat ? getCategoryLabel(cat, t) : budget.category}</span>
                    {isOver && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                    {!isOver && !isWarning && percentage > 0 && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold tabular-nums ${isOver ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-foreground'}`}>
                      {formatCurrency(spent, currency)} / {formatCurrency(budget.monthly_limit, currency)}
                    </span>
                    <button onClick={() => onDelete(budget.id)} className="p-1 rounded-lg text-muted-foreground hover:text-rose-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="h-2.5 bg-muted/30 dark:bg-white/[0.04] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: isOver ? '#fb7185' : isWarning ? '#fbbf24' : (cat?.hexColor || 'hsl(var(--primary))'),
                      boxShadow: `0 0 12px ${isOver ? '#fb718540' : cat?.hexColor + '40' || 'transparent'}`,
                    }}
                  />
                </div>
                <p className={`text-[10px] mt-1.5 font-medium ${isOver ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-muted-foreground'}`}>
                  {isOver
                    ? t('finance.budgets.exceeded', { amount: formatCurrency(spent - budget.monthly_limit, currency) })
                    : `${percentage.toFixed(0)}% ${t('finance.budgets.used')}`}
                </p>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
