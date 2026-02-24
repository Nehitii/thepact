import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { 
  type FinanceCategory,
  getItemCategory,
  groupItemsByCategory,
  getCategoryLabel,
} from '@/lib/financeCategories';
import type { FinancialItem } from '@/types/finance';

interface FinancialBlockProps {
  title: string;
  type: 'expense' | 'income';
  items: FinancialItem[];
  categories: FinanceCategory[];
  isLoading: boolean;
  onAdd: (name: string, amount: number, category?: string) => Promise<void>;
  onUpdate: (id: string, name: string, amount: number, category?: string) => Promise<void>;
  onDelete: (id: string) => void;
  isPending?: boolean;
}

interface CategoryGroupProps {
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

function CategoryGroup({
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
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="text-slate-500"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ 
            backgroundColor: `${hexColor}15`,
            boxShadow: `0 0 20px ${hexColor}20`
          }}
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
                    editingId === item.id 
                      ? 'neu-inset bg-white/[0.02]' 
                      : 'hover:bg-white/[0.03]'
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
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/10 z-50 rounded-xl">
                            {allCategories.map(cat => (
                              <SelectItem 
                                key={cat.value} 
                                value={cat.value}
                                className="text-white hover:bg-white/10 focus:bg-white/10 text-xs rounded-lg"
                              >
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
                          placeholder="Name"
                        />
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={editingData.amount}
                          onChange={(e) => onEditDataChange({ ...editingData, amount: e.target.value.replace(/[^0-9.]/g, '') })}
                          className="w-24 h-9 text-sm bg-white/[0.03] border-white/[0.1] text-white rounded-lg"
                          placeholder="Amount"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={onSaveEdit}
                          className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors shadow-[0_0_15px_hsla(160,80%,50%,0.2)]"
                        >
                          <Check className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={onCancelEdit}
                          className="p-2 rounded-lg bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-white/80 truncate pl-8">
                        {item.name}
                      </span>
                      <span className={`font-semibold text-sm tabular-nums ${
                        isExpense ? 'text-rose-400/90' : 'text-emerald-400/90'
                      }`}>
                        {formatCurrency(item.amount, currency)}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onStartEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </motion.button>
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
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const [newItem, setNewItem] = useState({ name: '', amount: '', category: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({ name: '', amount: '', category: '' });
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const totalAmount = items.filter(i => i.is_active).reduce((sum, i) => sum + i.amount, 0);
  const isExpense = type === 'expense';

  // Group items by category using shared utility
  const groupedItems = useMemo(() => {
    const groups = groupItemsByCategory(items, categories);
    
    return Array.from(groups.values()).sort((a, b) => {
      const totalA = a.items.reduce((sum, i) => sum + i.amount, 0);
      const totalB = b.items.reduce((sum, i) => sum + i.amount, 0);
      return totalB - totalA;
    });
  }, [items, categories]);

  const handleAdd = async () => {
    if (!newItem.name.trim() || !newItem.amount) return;
    await onAdd(newItem.name.trim(), parseFloat(newItem.amount), newItem.category || undefined);
    setNewItem({ name: '', amount: '', category: '' });
    setShowAddForm(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingData.name.trim() || !editingData.amount) return;
    await onUpdate(editingId, editingData.name.trim(), parseFloat(editingData.amount), editingData.category || undefined);
    setEditingId(null);
  };

  const startEdit = (item: FinancialItem) => {
    const itemCategory = getItemCategory(item, categories);
    setEditingId(item.id);
    setEditingData({ 
      name: item.name, 
      amount: item.amount.toString(),
      category: item.category || itemCategory.value
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
        className="w-full flex items-center justify-between p-6 hover:bg-white/[0.01] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: isExpense 
                ? 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(244,63,94,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)',
              border: `1px solid ${isExpense ? 'rgba(244,63,94,0.25)' : 'rgba(16,185,129,0.25)'}`,
              boxShadow: isExpense 
                ? '0 0 30px rgba(244,63,94,0.15)' 
                : '0 0 30px rgba(16,185,129,0.15)',
            }}
          >
            {DefaultIcon && <DefaultIcon className={`w-5 h-5 ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`} />}
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-500">
              {groupedItems.length} {groupedItems.length === 1 ? 'category' : 'categories'} · {items.length} items
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <span className={`text-2xl font-bold tabular-nums ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}
            style={{ 
              textShadow: isExpense 
                ? '0 0 30px rgba(244,63,94,0.3)' 
                : '0 0 30px rgba(16,185,129,0.3)' 
            }}
          >
            {isExpense ? '-' : '+'}{formatCurrency(totalAmount, currency)}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-8 h-8 rounded-lg neu-inset flex items-center justify-center"
          >
            <ChevronDown className="w-4 h-4 text-slate-400" />
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
              {/* Add Button / Form */}
              <AnimatePresence mode="wait">
                {showAddForm ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="neu-inset rounded-xl p-4 space-y-3"
                  >
                    <div className="flex gap-2">
                      <Select
                        value={newItem.category}
                        onValueChange={(val) => setNewItem({ ...newItem, category: val })}
                      >
                        <SelectTrigger className="w-[140px] h-11 bg-slate-800/60 border-white/[0.08] text-white rounded-lg">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/10 z-50 rounded-xl">
                          {categories.map(cat => (
                            <SelectItem 
                              key={cat.value} 
                              value={cat.value}
                              className="text-white hover:bg-white/10 focus:bg-white/10 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <cat.icon className="w-3.5 h-3.5" style={{ color: cat.hexColor }} />
                                <span>{getCategoryLabel(cat, t)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder={`New ${type}...`}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddForm(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAdd}
                        disabled={!newItem.name.trim() || !newItem.amount || isPending}
                        className={`${
                          isExpense 
                            ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400' 
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    key="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowAddForm(true)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full p-4 rounded-xl border-2 border-dashed transition-all duration-200 flex items-center justify-center gap-2 ${
                      isExpense 
                        ? 'border-rose-500/20 hover:border-rose-500/40 text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/[0.03]' 
                        : 'border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/[0.03]'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add {type}</span>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Category Groups */}
              <div className="space-y-3 max-h-[450px] overflow-y-auto scrollbar-thin pr-1">
                {isLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="w-8 h-8 border-2 border-slate-600 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : groupedItems.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                      isExpense ? 'bg-rose-500/10' : 'bg-emerald-500/10'
                    }`}>
                      {DefaultIcon && <DefaultIcon className={`w-8 h-8 ${isExpense ? 'text-rose-400/50' : 'text-emerald-400/50'}`} />}
                    </div>
                    <p className="text-slate-500 text-sm">No recurring {type}s yet</p>
                    <p className="text-slate-600 text-xs mt-1">Click above to add your first one</p>
                  </div>
                ) : (
                  groupedItems.map(({ category, items: groupItems }, index) => (
                    <motion.div
                      key={category.value}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
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