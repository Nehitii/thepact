import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import type { LucideIcon } from 'lucide-react';

interface Category {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

interface Item {
  id: string;
  name: string;
  amount: number;
  is_active: boolean;
}

interface FinancialBlockProps {
  title: string;
  type: 'expense' | 'income';
  items: Item[];
  categories: Category[];
  isLoading: boolean;
  onAdd: (name: string, amount: number) => Promise<void>;
  onUpdate: (id: string, name: string, amount: number) => Promise<void>;
  onDelete: (id: string) => void;
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
  isPending,
}: FinancialBlockProps) {
  const { currency } = useCurrency();
  const [newItem, setNewItem] = useState({ name: '', amount: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({ name: '', amount: '' });
  const [isExpanded, setIsExpanded] = useState(true);

  const totalAmount = items.filter(i => i.is_active).reduce((sum, i) => sum + i.amount, 0);
  const isExpense = type === 'expense';
  const accentColor = isExpense ? 'rose' : 'emerald';

  const handleAdd = async () => {
    if (!newItem.name.trim() || !newItem.amount) return;
    await onAdd(newItem.name.trim(), parseFloat(newItem.amount));
    setNewItem({ name: '', amount: '' });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingData.name.trim() || !editingData.amount) return;
    await onUpdate(editingId, editingData.name.trim(), parseFloat(editingData.amount));
    setEditingId(null);
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditingData({ name: item.name, amount: item.amount.toString() });
  };

  const DefaultIcon = categories[0]?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-2xl bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/30 border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden`}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl bg-${accentColor}-500/10 border border-${accentColor}-500/20 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`}
            style={{
              backgroundColor: isExpense ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
              borderColor: isExpense ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)',
            }}
          >
            {DefaultIcon && <DefaultIcon className={`w-5 h-5 ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`} />}
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-500">{items.length} items</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-xl font-semibold tabular-nums ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isExpense ? '-' : '+'}{formatCurrency(totalAmount, currency)}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-5 pb-5 space-y-4">
              {/* Add Form */}
              <div className="flex gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <Input
                  placeholder={`New ${type}...`}
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="flex-1 h-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-white/20"
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
                    className="h-10 pl-6 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-500 focus:border-white/20"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!newItem.name.trim() || !newItem.amount || isPending}
                  className={`h-10 px-4 ${
                    isExpense 
                      ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20' 
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20'
                  } transition-all`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin">
                {isLoading ? (
                  <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-8">
                    No recurring {type}s yet
                  </p>
                ) : (
                  items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
                        item.is_active
                          ? 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.03]'
                          : 'bg-white/[0.01] border-white/[0.02] opacity-50'
                      }`}
                    >
                      {editingId === item.id ? (
                        <>
                          <Input
                            value={editingData.name}
                            onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                            className="flex-1 h-9 text-sm bg-white/[0.03] border-white/[0.08] text-white"
                          />
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={editingData.amount}
                            onChange={(e) => setEditingData({ ...editingData, amount: e.target.value.replace(/[^0-9.]/g, '') })}
                            className="w-24 h-9 text-sm bg-white/[0.03] border-white/[0.08] text-white"
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 rounded-lg bg-slate-500/15 text-slate-400 hover:bg-slate-500/25 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0`}
                            style={{
                              backgroundColor: isExpense ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
                            }}
                          >
                            {DefaultIcon && <DefaultIcon className={`h-4 w-4 ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`} />}
                          </div>
                          <span className="flex-1 text-sm font-medium text-white truncate">
                            {item.name}
                          </span>
                          <span className={`font-semibold text-sm tabular-nums ${
                            isExpense ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {isExpense ? '-' : '+'}{formatCurrency(item.amount, currency)}
                          </span>
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 rounded-lg text-slate-500 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/[0.05] transition-all"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
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
