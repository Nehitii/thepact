// FinancialBlock.tsx
import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Check, X, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";

/**
 * IMPORTANT
 * This component expects Category.color and Category.bg to be Tailwind class strings
 * e.g. { color: "text-rose-400", bg: "bg-rose-500/10" }
 * and applies them via className (not inline style).
 *
 * For Dark Neumorphic "Slate", add these utilities in globals.css:
 *
 * @layer utilities {
 *   .neo-surface {
 *     background: rgba(15, 23, 42, 0.72);
 *     box-shadow:
 *       10px 10px 22px rgba(0,0,0,0.55),
 *       -10px -10px 22px rgba(255,255,255,0.035);
 *   }
 *   .neo-surface-soft {
 *     background: rgba(15, 23, 42, 0.55);
 *     box-shadow:
 *       8px 8px 16px rgba(0,0,0,0.48),
 *       -8px -8px 16px rgba(255,255,255,0.03);
 *   }
 *   .neo-inset {
 *     background: rgba(2, 6, 23, 0.45);
 *     box-shadow:
 *       inset 8px 8px 14px rgba(0,0,0,0.55),
 *       inset -8px -8px 14px rgba(255,255,255,0.04);
 *   }
 *   .neo-ring { outline: 1px solid rgba(255,255,255,0.06); }
 *   .neo-divider { border-top: 1px solid rgba(255,255,255,0.06); }
 *   .neo-pressable { transition: transform .15s ease, background .2s ease, box-shadow .2s ease; }
 *   .neo-pressable:active { transform: scale(0.985); }
 * }
 */

export interface Category {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string; // tailwind class (e.g. "text-rose-400")
  bg: string; // tailwind class (e.g. "bg-rose-500/10")
}

export interface Item {
  id: string;
  name: string;
  amount: number;
  is_active: boolean;
  category?: string | null;
}

export interface FinancialBlockProps {
  title: string;
  type: "expense" | "income";
  items: Item[];
  categories: Category[];
  isLoading: boolean;
  onAdd: (name: string, amount: number, category?: string) => Promise<void>;
  onUpdate: (id: string, name: string, amount: number, category?: string) => Promise<void>;
  onDelete: (id: string) => void;
  isPending?: boolean;
}

// ---------- Helpers ----------

// Accepts "12", "12.5", "12,5", "  12,50  " -> "12.50"
function sanitizeAmountInput(raw: string) {
  // keep digits, dot, comma
  const cleaned = raw.replace(/[^\d.,]/g, "");
  // if both present, prefer last separator as decimal, remove others
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  const decIndex = Math.max(lastDot, lastComma);

  if (decIndex === -1) return cleaned.replace(/[.,]/g, "");

  const intPart = cleaned.slice(0, decIndex).replace(/[.,]/g, "");
  const decPart = cleaned.slice(decIndex + 1).replace(/[.,]/g, "");
  return decPart.length ? `${intPart}.${decPart}` : intPart;
}

function parseAmountOrNull(s: string) {
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n;
}

// Fallback auto-detection when item.category missing
function detectCategory(itemName: string, categories: Category[]): Category {
  const lowerName = itemName.toLowerCase();

  const keywordMap: Record<string, string[]> = {
    housing: ["rent", "mortgage", "housing", "apartment", "lease", "hoa"],
    utilities: ["electric", "water", "gas", "utility", "internet", "wifi", "phone", "mobile", "cable"],
    transport: ["car", "auto", "fuel", "transport", "metro", "bus", "uber", "lyft", "parking"],
    food: ["food", "grocery", "groceries", "restaurant", "dining", "meal", "lunch", "dinner", "breakfast"],
    health: ["health", "medical", "doctor", "dentist", "pharmacy", "medicine", "gym", "fitness"],
    subscriptions: ["netflix", "spotify", "subscription", "streaming", "premium", "plus", "membership"],
    entertainment: ["entertainment", "movie", "game", "concert", "event", "hobby"],
    education: ["education", "course", "school", "college", "tuition", "book", "learning"],
    shopping: ["shopping", "clothes", "amazon", "retail", "purchase"],
    savings: ["saving", "investment", "invest", "401k", "ira", "retirement"],
    debt: ["debt", "loan", "credit", "payment", "interest"],
    insurance: ["insurance", "policy", "coverage"],
    childcare: ["child", "daycare", "babysit", "kid"],
    pets: ["pet", "dog", "cat", "vet", "animal"],
    gifts: ["gift", "donation", "charity", "present"],
    taxes: ["tax", "irs", "federal", "state"],
    salary: ["salary", "paycheck", "wage", "pay"],
    freelance: ["freelance", "contract", "consulting", "gig"],
    business: ["business", "profit", "revenue", "sales"],
    investments: ["dividend", "investment", "stock", "bond", "capital"],
    rental: ["rental", "tenant", "property"],
    bonus: ["bonus", "commission", "incentive"],
    pension: ["pension", "social security"],
    benefits: ["benefit", "subsidy", "allowance", "stipend"],
    royalties: ["royalty", "royalties", "licensing"],
    refunds: ["refund", "rebate", "cashback", "return"],
    other: ["other", "misc", "miscellaneous"],
  };

  for (const [categoryValue, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((k) => lowerName.includes(k))) {
      const found = categories.find((c) => c.value === categoryValue);
      if (found) return found;
    }
  }

  return categories.find((c) => c.value === "other") || categories[0];
}

function getItemCategory(item: Item, categories: Category[]): Category {
  if (item.category) {
    const found = categories.find((c) => c.value === item.category);
    if (found) return found;
  }
  return detectCategory(item.name, categories);
}

// ---------- Subcomponent: CategoryGroup ----------

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
  const Icon = category.icon;

  const activeTotal = useMemo(() => items.filter((i) => i.is_active).reduce((sum, i) => sum + i.amount, 0), [items]);

  return (
    <div className="rounded-2xl neo-surface-soft neo-ring overflow-hidden">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-3 neo-pressable hover:bg-white/[0.015]"
      >
        <motion.div animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </motion.div>

        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 neo-inset ${category.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${category.color}`} />
        </div>

        <span className="flex-1 text-left text-sm font-medium text-white/90">{category.label}</span>

        <span className="text-xs text-slate-500 mr-2 tabular-nums">{items.length}</span>

        <span className={`text-sm font-semibold tabular-nums ${isExpense ? "text-rose-300" : "text-emerald-300"}`}>
          {isExpense ? "-" : "+"}
          {formatCurrency(activeTotal, currency)}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-3 pb-3 space-y-1.5">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`group flex items-center gap-2.5 p-2.5 pl-10 rounded-xl transition-all duration-200 ${
                    item.is_active ? "hover:bg-white/[0.015] hover:shadow-[0_10px_18px_rgba(0,0,0,0.35)]" : "opacity-40"
                  }`}
                >
                  {editingId === item.id ? (
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={editingData.category}
                          onValueChange={(val) => onEditDataChange({ ...editingData, category: val })}
                        >
                          <SelectTrigger className="w-[140px] h-9 rounded-xl neo-inset neo-ring text-xs text-white/90">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 z-50">
                            {allCategories.map((cat) => (
                              <SelectItem
                                key={cat.value}
                                value={cat.value}
                                className="text-white hover:bg-white/10 focus:bg-white/10 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <cat.icon className={`w-3 h-3 ${cat.color}`} />
                                  <span>{cat.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          value={editingData.name}
                          onChange={(e) => onEditDataChange({ ...editingData, name: e.target.value })}
                          className="flex-1 h-9 rounded-xl neo-inset neo-ring text-sm text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="Name"
                          maxLength={50}
                        />

                        <Input
                          type="text"
                          inputMode="decimal"
                          value={editingData.amount}
                          onChange={(e) =>
                            onEditDataChange({ ...editingData, amount: sanitizeAmountInput(e.target.value) })
                          }
                          className="w-24 h-9 rounded-xl neo-inset neo-ring text-sm text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="Amount"
                        />

                        <button
                          onClick={onSaveEdit}
                          className="p-2 rounded-xl neo-pressable neo-surface-soft neo-ring text-emerald-300 hover:bg-white/[0.02]"
                          aria-label="Save"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={onCancelEdit}
                          className="p-2 rounded-xl neo-pressable neo-surface-soft neo-ring text-slate-300 hover:bg-white/[0.02]"
                          aria-label="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-white/80 truncate">{item.name}</span>

                      <span
                        className={`font-medium text-sm tabular-nums ${
                          isExpense ? "text-rose-300/90" : "text-emerald-300/90"
                        }`}
                      >
                        {formatCurrency(item.amount, currency)}
                      </span>

                      <button
                        onClick={() => onStartEdit(item)}
                        className="p-2 rounded-xl neo-pressable opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white hover:bg-white/[0.03]"
                        aria-label="Edit"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>

                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-2 rounded-xl neo-pressable opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10"
                        aria-label="Delete"
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

// ---------- Main component ----------

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
  const [newItem, setNewItem] = useState({ name: "", amount: "", category: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({ name: "", amount: "", category: "" });
  const [isExpanded, setIsExpanded] = useState(true);

  const isExpense = type === "expense";

  const totalAmount = useMemo(() => items.filter((i) => i.is_active).reduce((sum, i) => sum + i.amount, 0), [items]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, { category: Category; items: Item[] }>();

    for (const item of items) {
      const cat = getItemCategory(item, categories);
      const existing = groups.get(cat.value);
      if (existing) existing.items.push(item);
      else groups.set(cat.value, { category: cat, items: [item] });
    }

    return Array.from(groups.values()).sort((a, b) => {
      const totalA = a.items.filter((i) => i.is_active).reduce((sum, i) => sum + i.amount, 0);
      const totalB = b.items.filter((i) => i.is_active).reduce((sum, i) => sum + i.amount, 0);
      return totalB - totalA;
    });
  }, [items, categories]);

  const DefaultIcon = categories[0]?.icon;

  const handleAdd = useCallback(async () => {
    const name = newItem.name.trim();
    const amountNum = parseAmountOrNull(newItem.amount);

    if (!name || amountNum === null) return;

    await onAdd(name, amountNum, newItem.category || undefined);
    setNewItem({ name: "", amount: "", category: "" });
  }, [newItem, onAdd]);

  const startEdit = useCallback(
    (item: Item) => {
      const itemCategory = getItemCategory(item, categories);
      setEditingId(item.id);
      setEditingData({
        name: item.name,
        amount: String(item.amount),
        category: item.category || itemCategory.value,
      });
    },
    [categories],
  );

  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return;

    const name = editingData.name.trim();
    const amountNum = parseAmountOrNull(editingData.amount);

    if (!name || amountNum === null) return;

    await onUpdate(editingId, name, amountNum, editingData.category || undefined);
    setEditingId(null);
  }, [editingId, editingData, onUpdate]);

  const canAdd = Boolean(newItem.name.trim()) && parseAmountOrNull(newItem.amount) !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl neo-surface neo-ring overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-5 neo-pressable hover:bg-white/[0.015]"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl neo-inset neo-ring flex items-center justify-center">
            {DefaultIcon && <DefaultIcon className={`w-5 h-5 ${isExpense ? "text-rose-300" : "text-emerald-300"}`} />}
          </div>

          <div className="text-left">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-500">
              {groupedItems.length} {groupedItems.length === 1 ? "category" : "categories"} · {items.length} items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={`text-xl font-semibold tabular-nums ${isExpense ? "text-rose-300" : "text-emerald-300"}`}>
            {isExpense ? "-" : "+"}
            {formatCurrency(totalAmount, currency)}
          </span>

          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="neo-divider" />

            <div className="px-5 pb-5 pt-4 space-y-4">
              {/* Add Form */}
              <div className="flex gap-2 p-4 rounded-2xl neo-inset neo-ring">
                <Select value={newItem.category} onValueChange={(val) => setNewItem((p) => ({ ...p, category: val }))}>
                  <SelectTrigger className="w-[150px] h-10 rounded-xl neo-inset neo-ring text-white/90">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 z-50">
                    {categories.map((cat) => (
                      <SelectItem
                        key={cat.value}
                        value={cat.value}
                        className="text-white hover:bg-white/10 focus:bg-white/10"
                      >
                        <div className="flex items-center gap-2">
                          <cat.icon className={`w-3.5 h-3.5 ${cat.color}`} />
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder={`New ${type}...`}
                  value={newItem.name}
                  onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                  className="flex-1 h-10 rounded-xl neo-inset neo-ring text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  maxLength={50}
                />

                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    {getCurrencySymbol(currency)}
                  </span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={newItem.amount}
                    onChange={(e) => setNewItem((p) => ({ ...p, amount: sanitizeAmountInput(e.target.value) }))}
                    className="h-10 pl-7 rounded-xl neo-inset neo-ring text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!canAdd || Boolean(isPending)}
                  className={`h-10 px-4 rounded-xl neo-surface-soft neo-pressable neo-ring hover:bg-white/[0.02] disabled:opacity-40 ${
                    isExpense ? "text-rose-300" : "text-emerald-300"
                  }`}
                  aria-label="Add"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Category Groups */}
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                {isLoading ? (
                  <div className="py-10 flex justify-center">
                    <div className="w-7 h-7 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
                  </div>
                ) : groupedItems.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-10">No recurring {type}s yet</p>
                ) : (
                  groupedItems.map(({ category, items: groupItems }, index) => (
                    <motion.div
                      key={category.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.045 }}
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
