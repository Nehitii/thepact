import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCurrencySymbol } from '@/lib/currency';
import { type FinanceCategory, getCategoryLabel } from '@/lib/financeCategories';

interface AddItemFormProps {
  type: 'expense' | 'income';
  categories: FinanceCategory[];
  currency: string;
  isPending?: boolean;
  onAdd: (name: string, amount: number, category?: string) => Promise<void>;
}

export function AddItemForm({ type, categories, currency, isPending, onAdd }: AddItemFormProps) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', amount: '', category: '' });
  const isExpense = type === 'expense';

  const handleAdd = async () => {
    if (!newItem.name.trim() || !newItem.amount) return;
    await onAdd(newItem.name.trim(), parseFloat(newItem.amount), newItem.category || undefined);
    setNewItem({ name: '', amount: '', category: '' });
    setShowForm(false);
  };

  return (
    <AnimatePresence mode="wait">
      {showForm ? (
        <motion.div
          key="form"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="neu-inset rounded-xl p-4 space-y-3"
        >
          <div className="flex gap-2">
            <Select value={newItem.category} onValueChange={(val) => setNewItem({ ...newItem, category: val })}>
              <SelectTrigger className="w-[140px] h-11 bg-slate-800/60 border-white/[0.08] text-white rounded-lg">
                <SelectValue placeholder={t('finance.recurring.category')} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10 z-50 rounded-xl">
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-white/10 focus:bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <cat.icon className="w-3.5 h-3.5" style={{ color: cat.hexColor }} />
                      <span>{getCategoryLabel(cat, t)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder={t('finance.recurring.newPlaceholder', { type: t(`finance.recurring.${type}Single`) })}
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="flex-1 h-11 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-500 rounded-lg"
              maxLength={50}
            />
            <div className="relative w-28">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={newItem.amount}
                onChange={(e) => setNewItem({ ...newItem, amount: e.target.value.replace(/[^0-9.]/g, '') })}
                className="h-11 pl-7 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-500 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!newItem.name.trim() || !newItem.amount || isPending}
              className={isExpense
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t('common.add')}
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.button
          key="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowForm(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`w-full p-4 rounded-xl border-2 border-dashed transition-all duration-200 flex items-center justify-center gap-2 ${
            isExpense
              ? 'border-rose-500/20 hover:border-rose-500/40 text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/[0.03]'
              : 'border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/[0.03]'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">{t('finance.recurring.addType', { type: t(`finance.recurring.${type}Single`) })}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
