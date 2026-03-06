import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, Check, X, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/currency';
import { type FinanceCategory, getCategoryLabel } from '@/lib/financeCategories';
import type { FinancialItem } from '@/types/finance';

export interface CategoryGroupProps {
  category: FinanceCategory;
  items: FinancialItem[];
  allCategories: FinanceCategory[];
  isExpense: boolean;
  currency: string;
  editingId: string | null;
  editingData: { name: string; amount: string; category: string };
  onStartEdit: (item: FinancialItem) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditDataChange: (data: { name: string; amount: string; category: string }) => void;
  onDelete: (id: string) => void;
}

export function CategoryGroup({
  category,
  items,
  allCategories,
  isExpense,
  currency,
  editingId,
  editingData,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditDataChange,
  onDelete,
}: CategoryGroupProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const categoryTotal = items.filter(i => i.is_active).reduce((sum, i) => sum + i.amount, 0);
  const Icon = category.icon;
  const hexColor = category.hexColor;

  return (
    <motion.div
      className="category-pill overflow-hidden"
      style={{ '--category-color': hexColor } as React.CSSProperties}
      layout
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-all duration-200"
      >
        <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.15 }} className="text-slate-500">
          <ChevronRight className="w-4 h-4" />
        </motion.div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ backgroundColor: `${hexColor}15`, boxShadow: `0 0 20px ${hexColor}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: hexColor }} />
        </div>
        <span className="flex-1 text-left text-sm font-semibold text-white/90">
          {getCategoryLabel(category, t)}
        </span>
        <span className="text-xs text-slate-500 px-2 py-0.5 rounded-full bg-white/[0.03]">
          {items.length}
        </span>
        <span className={`text-sm font-bold tabular-nums ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
          {isExpense ? '-' : '+'}{formatCurrency(categoryTotal, currency)}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-4 pb-4 space-y-2">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    editingId === item.id ? 'neu-inset bg-white/[0.02]' : 'hover:bg-white/[0.03]'
                  } ${!item.is_active ? 'opacity-40' : ''}`}
                >
                  {editingId === item.id ? (
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Select
                          value={editingData.category}
                          onValueChange={(val) => onEditDataChange({ ...editingData, category: val })}
                        >
                          <SelectTrigger className="w-[130px] h-9 text-xs bg-slate-800/80 border-white/[0.1] text-white rounded-lg">
                            <SelectValue placeholder={t('finance.recurring.category')} />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/10 z-50 rounded-xl">
                            {allCategories.map(cat => (
                              <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-white/10 focus:bg-white/10 text-xs rounded-lg">
                                <div className="flex items-center gap-2">
                                  <cat.icon className="w-3 h-3" style={{ color: cat.hexColor }} />
                                  <span>{getCategoryLabel(cat, t)}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={editingData.name}
                          onChange={(e) => onEditDataChange({ ...editingData, name: e.target.value })}
                          className="flex-1 h-9 text-sm bg-white/[0.03] border-white/[0.1] text-white rounded-lg"
                          placeholder={t('finance.recurring.namePlaceholder')}
                        />
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={editingData.amount}
                          onChange={(e) => onEditDataChange({ ...editingData, amount: e.target.value.replace(/[^0-9.]/g, '') })}
                          className="w-24 h-9 text-sm bg-white/[0.03] border-white/[0.1] text-white rounded-lg"
                          placeholder={t('finance.recurring.amountPlaceholder')}
                        />
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onSaveEdit}
                          className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors shadow-[0_0_15px_hsla(160,80%,50%,0.2)]"
                        >
                          <Check className="h-4 w-4" />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onCancelEdit}
                          className="p-2 rounded-lg bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-white/80 truncate pl-8">{item.name}</span>
                      <span className={`font-semibold text-sm tabular-nums ${isExpense ? 'text-rose-400/90' : 'text-emerald-400/90'}`}>
                        {formatCurrency(item.amount, currency)}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onStartEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </motion.button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </motion.button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gradient-to-br from-[#0d1220] to-[#080c14] border-white/[0.08]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">{t('finance.deleteConfirm.title')}</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                {t('finance.deleteConfirm.description', { name: item.name })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-white/[0.1] text-slate-300 hover:bg-white/[0.04]">{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(item.id)} className="bg-rose-600 hover:bg-rose-500 text-white">
                                {t('finance.deleteConfirm.confirm')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
