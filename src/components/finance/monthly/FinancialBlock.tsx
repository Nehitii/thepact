import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  category?: string | null;
}

interface FinancialBlockProps {
  title: string;
  type: 'expense' | 'income';
  items: Item[];
  categories: Category[];
  isLoading: boolean;
  onAdd: (name: string, amount: number, category?: string) => Promise<void>;
  onUpdate: (id: string, name: string, amount: number, category?: string) => Promise<void>;
  onDelete: (id: string) => void;
  isPending?: boolean;
}

// Helper to detect category from item name (fallback when no category is set)
function detectCategory(itemName: string, categories: Category[]): Category {
  const lowerName = itemName.toLowerCase();
  
  const keywordMap: Record<string, string[]> = {
    'housing': ['rent', 'mortgage', 'housing', 'apartment', 'lease', 'hoa'],
    'utilities': ['electric', 'water', 'gas', 'utility', 'internet', 'wifi', 'phone', 'mobile', 'cable'],
    'transport': ['car', 'auto', 'fuel', 'transport', 'metro', 'bus', 'uber', 'lyft', 'parking'],
    'food': ['food', 'grocery', 'groceries', 'restaurant', 'dining', 'meal', 'lunch', 'dinner', 'breakfast'],
    'health': ['health', 'medical', 'doctor', 'dentist', 'pharmacy', 'medicine', 'gym', 'fitness'],
    'subscriptions': ['netflix', 'spotify', 'subscription', 'streaming', 'premium', 'plus', 'membership'],
    'entertainment': ['entertainment', 'movie', 'game', 'concert', 'event', 'hobby'],
    'education': ['education', 'course', 'school', 'college', 'tuition', 'book', 'learning'],
    'shopping': ['shopping', 'clothes', 'amazon', 'retail', 'purchase'],
    'savings': ['saving', 'investment', 'invest', '401k', 'ira', 'retirement'],
    'debt': ['debt', 'loan', 'credit', 'payment', 'interest'],
    'insurance': ['insurance', 'policy', 'coverage'],
    'childcare': ['child', 'daycare', 'babysit', 'kid'],
    'pets': ['pet', 'dog', 'cat', 'vet', 'animal'],
    'gifts': ['gift', 'donation', 'charity', 'present'],
    'taxes': ['tax', 'irs', 'federal', 'state'],
    'salary': ['salary', 'paycheck', 'wage', 'pay'],
    'freelance': ['freelance', 'contract', 'consulting', 'gig'],
    'business': ['business', 'profit', 'revenue', 'sales'],
    'investments': ['dividend', 'investment', 'stock', 'bond', 'capital'],
    'rental': ['rental', 'tenant', 'property'],
    'bonus': ['bonus', 'commission', 'incentive'],
    'pension': ['pension', 'social security'],
    'benefits': ['benefit', 'subsidy', 'allowance', 'stipend'],
    'royalties': ['royalty', 'royalties', 'licensing'],
    'refunds': ['refund', 'rebate', 'cashback', 'return'],
    'other': ['other', 'misc', 'miscellaneous'],
  };

  for (const [categoryValue, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      const found = categories.find(c => c.value === categoryValue);
      if (found) return found;
    }
  }

  return categories.find(c => c.value === 'other') || categories[0];
}

// Get category for an item - use stored category or fall back to auto-detection
function getItemCategory(item: Item, categories: Category[]): Category {
  if (item.category) {
    const found = categories.find(c => c.value === item.category);
    if (found) return found;
  }
  return detectCategory(item.name, categories);
}

interface CategoryGroupProps {
  category: Category;
  items: Item[];
  allCategories: Category[];
  isExpense: boolean;
  currency: string;
  editingId: string | null;
  editingData: { name: string; amount: string; category: string };
  onStartEdit: (item: Item) => void;
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
  const [isOpen, setIsOpen] = useState(true);
  const categoryTotal = items.filter(i => i.is_active).reduce((sum, i) => sum + i.amount, 0);
  const Icon = category.icon;

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors"
      >
        <motion.div
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </motion.div>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: category.bg }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: category.color }} />
        </div>
        <span className="flex-1 text-left text-sm font-medium text-white/90">
          {category.label}
        </span>
        <span className="text-xs text-slate-500 mr-2">{items.length}</span>
        <span className={`text-sm font-semibold tabular-nums ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
          {isExpense ? '-' : '+'}{formatCurrency(categoryTotal, currency)}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-3 pb-3 space-y-1.5">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`group flex items-center gap-2.5 p-2.5 pl-10 rounded-lg transition-all duration-200 ${
                    item.is_active
                      ? 'hover:bg-white/[0.03]'
                      : 'opacity-40'
                  }`}
                >
                  {editingId === item.id ? (
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={editingData.category}
                          onValueChange={(val) => onEditDataChange({ ...editingData, category: val })}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs bg-slate-800 border-white/[0.08] text-white">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/10 z-50">
                            {allCategories.map(cat => (
                              <SelectItem 
                                key={cat.value} 
                                value={cat.value}
                                className="text-white hover:bg-white/10 focus:bg-white/10 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <cat.icon className="w-3 h-3" style={{ color: cat.color }} />
                                  <span>{cat.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={editingData.name}
                          onChange={(e) => onEditDataChange({ ...editingData, name: e.target.value })}
                          className="flex-1 h-8 text-sm bg-white/[0.03] border-white/[0.08] text-white"
                          placeholder="Name"
                        />
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={editingData.amount}
                          onChange={(e) => onEditDataChange({ ...editingData, amount: e.target.value.replace(/[^0-9.]/g, '') })}
                          className="w-20 h-8 text-sm bg-white/[0.03] border-white/[0.08] text-white"
                          placeholder="Amount"
                        />
                        <button
                          onClick={onSaveEdit}
                          className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={onCancelEdit}
                          className="p-1.5 rounded-lg bg-slate-500/15 text-slate-400 hover:bg-slate-500/25 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-white/80 truncate">
                        {item.name}
                      </span>
                      <span className={`font-medium text-sm tabular-nums ${
                        isExpense ? 'text-rose-400/80' : 'text-emerald-400/80'
                      }`}>
                        {formatCurrency(item.amount, currency)}
                      </span>
                      <button
                        onClick={() => onStartEdit(item)}
                        className="p-1 rounded text-slate-500 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/[0.05] transition-all"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1 rounded text-slate-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  const { currency } = useCurrency();
  const [newItem, setNewItem] = useState({ name: '', amount: '', category: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({ name: '', amount: '', category: '' });
  const [isExpanded, setIsExpanded] = useState(true);

  const totalAmount = items.filter(i => i.is_active).reduce((sum, i) => sum + i.amount, 0);
  const isExpense = type === 'expense';

  // Group items by category (stored or auto-detected)
  const groupedItems = useMemo(() => {
    const groups = new Map<string, { category: Category; items: Item[] }>();
    
    items.forEach(item => {
      const category = getItemCategory(item, categories);
      const existing = groups.get(category.value);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(category.value, { category, items: [item] });
      }
    });

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
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingData.name.trim() || !editingData.amount) return;
    await onUpdate(editingId, editingData.name.trim(), parseFloat(editingData.amount), editingData.category || undefined);
    setEditingId(null);
  };

  const startEdit = (item: Item) => {
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
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/30 border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            style={{
              backgroundColor: isExpense ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
              borderColor: isExpense ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)',
              borderWidth: 1,
            }}
          >
            {DefaultIcon && <DefaultIcon className={`w-5 h-5 ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`} />}
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-500">
              {groupedItems.length} {groupedItems.length === 1 ? 'category' : 'categories'} · {items.length} items
            </p>
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
                <Select
                  value={newItem.category}
                  onValueChange={(val) => setNewItem({ ...newItem, category: val })}
                >
                  <SelectTrigger className="w-[140px] h-10 bg-slate-800 border-white/[0.08] text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10 z-50">
                    {categories.map(cat => (
                      <SelectItem 
                        key={cat.value} 
                        value={cat.value}
                        className="text-white hover:bg-white/10 focus:bg-white/10"
                      >
                        <div className="flex items-center gap-2">
                          <cat.icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              {/* Category Groups */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
                {isLoading ? (
                  <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
                  </div>
                ) : groupedItems.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-8">
                    No recurring {type}s yet
                  </p>
                ) : (
                  groupedItems.map(({ category, items: groupItems }, index) => (
                    <motion.div
                      key={category.value}
                      initial={{ opacity: 0, y: 10 }}
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
