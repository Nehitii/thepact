import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import {
  type FinanceCategory,
  getItemCategory,
  groupItemsByCategory,
} from '@/lib/financeCategories';
import type { FinancialItem } from '@/types/finance';
import { CategoryGroup } from './CategoryGroup';
import { AddItemForm } from './AddItemForm';

interface FinancialBlockProps {
  title: string;
  type: 'expense' | 'income';
  items: FinancialItem[];
  categories: FinanceCategory[];
  isLoading: boolean;
  onAdd: (name: string, amount: number, category?: string, iconEmoji?: string, iconUrl?: string) => Promise<void>;
  onUpdate: (id: string, name: string, amount: number, category?: string, iconEmoji?: string, iconUrl?: string) => Promise<void>;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
  isPending?: boolean;
}

export function FinancialBlock({
  title,
  type,
  items,
  categories,
  isLoading,
  onAdd,
  onUpdate,
  onDelete,
  onToggleActive,
  isPending,
}: FinancialBlockProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({ name: '', amount: '', category: '', iconUrl: '' });
  const [isExpanded, setIsExpanded] = useState(true);

  const totalAmount = items.filter(i => i.is_active).reduce((sum, i) => sum + i.amount, 0);
  const isExpense = type === 'expense';

  const groupedItems = useMemo(() => {
    const groups = groupItemsByCategory(items, categories);
    return Array.from(groups.values()).sort((a, b) => {
      const totalA = a.items.reduce((sum, i) => sum + i.amount, 0);
      const totalB = b.items.reduce((sum, i) => sum + i.amount, 0);
      return totalB - totalA;
    });
  }, [items, categories]);

  const handleSaveEdit = async () => {
    if (!editingId || !editingData.name.trim() || !editingData.amount) return;
    await onUpdate(
      editingId,
      editingData.name.trim(),
      parseFloat(editingData.amount),
      editingData.category || undefined,
      undefined,
      editingData.iconUrl || undefined,
    );
    setEditingId(null);
  };

  const startEdit = (item: FinancialItem) => {
    const itemCategory = getItemCategory(item, categories);
    setEditingId(item.id);
    setEditingData({
      name: item.name,
      amount: item.amount.toString(),
      category: item.category || itemCategory.value,
      iconUrl: item.icon_url || '',
    });
  };

  const DefaultIcon = categories[0]?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="neu-card overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-muted/30 dark:hover:bg-white/[0.01] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: isExpense
                ? 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(244,63,94,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)',
              border: `1px solid ${isExpense ? 'rgba(244,63,94,0.25)' : 'rgba(16,185,129,0.25)'}`,
              boxShadow: isExpense ? '0 0 30px rgba(244,63,94,0.15)' : '0 0 30px rgba(16,185,129,0.15)',
            }}
          >
            {DefaultIcon && <DefaultIcon className={`w-5 h-5 ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`} />}
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {t('finance.recurring.categorySummary', { categories: groupedItems.length, items: items.length })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <span
            className={`text-2xl font-bold tabular-nums ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}
            style={{ textShadow: isExpense ? '0 0 30px rgba(244,63,94,0.3)' : '0 0 30px rgba(16,185,129,0.3)' }}
          >
            {isExpense ? '-' : '+'}{formatCurrency(totalAmount, currency)}
          </span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="w-8 h-8 rounded-lg neu-inset flex items-center justify-center">
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-6 pb-6 space-y-4">
              <AddItemForm type={type} categories={categories} currency={currency} isPending={isPending} onAdd={onAdd} />

              {/* Category Groups */}
              <div className="space-y-3 max-h-[450px] overflow-y-auto scrollbar-thin pr-1">
                {isLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : groupedItems.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${isExpense ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                      {DefaultIcon && <DefaultIcon className={`w-8 h-8 ${isExpense ? 'text-rose-400/50' : 'text-emerald-400/50'}`} />}
                    </div>
                    <p className="text-muted-foreground text-sm">{t('finance.recurring.emptyTitle', { type: t(`finance.recurring.${type}Single`) })}</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">{t('finance.recurring.emptyHint')}</p>
                  </div>
                ) : (
                  groupedItems.map(({ category, items: groupItems }, index) => (
                    <motion.div key={category.value} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <CategoryGroup
                        category={category}
                        items={groupItems}
                        allCategories={categories}
                        isExpense={isExpense}
                        currency={currency}
                        editingId={editingId}
                        editingData={editingData}
                        onStartEdit={startEdit}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={() => setEditingId(null)}
                        onEditDataChange={setEditingData}
                        onDelete={onDelete}
                        onToggleActive={onToggleActive}
                      />
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}