import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import type { LucideIcon } from 'lucide-react';

interface CategoryData {
  name: string;
  label?: string;
  value: number;
  color: string;
  icon?: LucideIcon;
}

interface TopCategoriesBarProps {
  data: CategoryData[];
  currency: string;
  maxItems?: number;
}

export function TopCategoriesBar({ data, currency, maxItems = 5 }: TopCategoriesBarProps) {
  const { t } = useTranslation();
  const topItems = data.slice(0, maxItems);
  const maxValue = topItems.length > 0 ? topItems[0].value : 1;

  if (topItems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="neu-inset p-5 rounded-2xl"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-rose-400" />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t('finance.analytics.topExpenses')}
        </span>
      </div>

      <div className="space-y-3">
        {topItems.map((cat, i) => {
          const Icon = cat.icon;
          const percentage = maxValue > 0 ? (cat.value / maxValue) * 100 : 0;
          return (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />}
                  <span className="text-xs text-foreground/80 font-medium">{cat.label || cat.name}</span>
                </div>
                <span className="text-xs font-semibold tabular-nums text-foreground">
                  {formatCurrency(cat.value, currency)}
                </span>
              </div>
              <div className="h-2 bg-muted/30 dark:bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color, boxShadow: `0 0 12px ${cat.color}40` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
