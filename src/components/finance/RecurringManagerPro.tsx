import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, TrendingDown, TrendingUp, Home, Car, Utensils, Wifi, Heart, ShoppingBag, Zap, DollarSign, Briefcase, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';
import {
  useRecurringExpenses,
  useRecurringIncome,
  useAddRecurringExpense,
  useAddRecurringIncome,
  useUpdateRecurringExpense,
  useUpdateRecurringIncome,
  useDeleteRecurringExpense,
  useDeleteRecurringIncome,
  RecurringExpense,
  RecurringIncome,
} from '@/hooks/useFinance';
import { toast } from 'sonner';

const EXPENSE_CATEGORIES = [
  { value: 'housing', label: 'Housing', icon: Home },
  { value: 'transport', label: 'Transport', icon: Car },
  { value: 'food', label: 'Food & Dining', icon: Utensils },
  { value: 'utilities', label: 'Utilities', icon: Wifi },
  { value: 'health', label: 'Health', icon: Heart },
  { value: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { value: 'entertainment', label: 'Entertainment', icon: Zap },
  { value: 'other', label: 'Other', icon: DollarSign },
];

const INCOME_CATEGORIES = [
  { value: 'salary', label: 'Salary', icon: Briefcase },
  { value: 'freelance', label: 'Freelance', icon: DollarSign },
  { value: 'investment', label: 'Investment', icon: TrendingUp },
  { value: 'gift', label: 'Gift', icon: Gift },
  { value: 'other', label: 'Other', icon: DollarSign },
];

interface EditingItem {
  id: string;
  name: string;
  amount: string;
  category?: string;
}

export function RecurringManagerPro() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  
  const { data: expenses = [], isLoading: expensesLoading } = useRecurringExpenses(user?.id);
  const { data: income = [], isLoading: incomeLoading } = useRecurringIncome(user?.id);
  
  const addExpense = useAddRecurringExpense();
  const addIncome = useAddRecurringIncome();
  const updateExpense = useUpdateRecurringExpense();
  const updateIncome = useUpdateRecurringIncome();
  const deleteExpense = useDeleteRecurringExpense();
  const deleteIncome = useDeleteRecurringIncome();

  const [newExpense, setNewExpense] = useState({ name: '', amount: '', category: 'other' });
  const [newIncome, setNewIncome] = useState({ name: '', amount: '', category: 'salary' });
  const [editingExpense, setEditingExpense] = useState<EditingItem | null>(null);
  const [editingIncome, setEditingIncome] = useState<EditingItem | null>(null);

  const totalExpenses = expenses.filter(e => e.is_active).reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = income.filter(i => i.is_active).reduce((sum, i) => sum + i.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  const handleAddExpense = async () => {
    if (!newExpense.name.trim() || !newExpense.amount) return;
    if (expenses.length >= 30) {
      toast.error('Maximum 30 recurring expenses allowed');
      return;
    }
    try {
      await addExpense.mutateAsync({
        name: newExpense.name.trim(),
        amount: parseFloat(newExpense.amount),
      });
      setNewExpense({ name: '', amount: '', category: 'other' });
      toast.success('Expense added');
    } catch (e) {
      toast.error('Failed to add expense');
    }
  };

  const handleAddIncome = async () => {
    if (!newIncome.name.trim() || !newIncome.amount) return;
    try {
      await addIncome.mutateAsync({
        name: newIncome.name.trim(),
        amount: parseFloat(newIncome.amount),
      });
      setNewIncome({ name: '', amount: '', category: 'salary' });
      toast.success('Income added');
    } catch (e) {
      toast.error('Failed to add income');
    }
  };

  const getCategoryIcon = (categoryValue: string, type: 'expense' | 'income') => {
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const category = categories.find(c => c.value === categoryValue);
    return category?.icon || DollarSign;
  };

  const renderItem = (
    item: RecurringExpense | RecurringIncome,
    type: 'expense' | 'income',
    editing: EditingItem | null,
    setEditing: (item: EditingItem | null) => void,
    onSave: () => void,
    onDelete: (id: string) => void
  ) => {
    const isEditing = editing?.id === item.id;
    const Icon = getCategoryIcon('other', type);
    const accentColor = type === 'expense' ? 'rose' : 'emerald';
    
    return (
      <div 
        key={item.id}
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
          item.is_active
            ? 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
            : 'bg-white/[0.01] border-white/[0.03] opacity-50'
        }`}
      >
        {isEditing ? (
          <>
            <Input
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="flex-1 h-9 text-sm bg-white/[0.02] border-white/[0.08]"
              placeholder="Name"
            />
            <Input
              type="number"
              value={editing.amount}
              onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
              className="w-24 h-9 text-sm bg-white/[0.02] border-white/[0.08]"
              placeholder="Amount"
            />
            <button
              onClick={onSave}
              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditing(null)}
              className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <div className={`w-8 h-8 rounded-lg bg-${accentColor}-500/10 flex items-center justify-center shrink-0`}>
              <Icon className={`h-4 w-4 text-${accentColor}-400`} />
            </div>
            <span className="flex-1 text-sm font-medium text-foreground truncate">
              {item.name}
            </span>
            <span className={`font-semibold text-sm tabular-nums ${
              type === 'expense' ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {type === 'expense' ? '-' : '+'}{formatCurrency(item.amount, currency)}
            </span>
            <button
              onClick={() => setEditing({ id: item.id, name: item.name, amount: item.amount.toString() })}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Net Balance Summary */}
      <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Monthly Balance</h3>
          <span className={`text-xl font-semibold tabular-nums ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance, currency)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/[0.1]">
            <p className="text-xs text-emerald-400 font-medium mb-1 uppercase tracking-wide">Total Income</p>
            <p className="text-lg font-semibold text-emerald-400 tabular-nums">
              +{formatCurrency(totalIncome, currency)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/[0.05] border border-rose-500/[0.1]">
            <p className="text-xs text-rose-400 font-medium mb-1 uppercase tracking-wide">Total Expenses</p>
            <p className="text-lg font-semibold text-rose-400 tabular-nums">
              -{formatCurrency(totalExpenses, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Recurring Expenses */}
      <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Recurring Expenses</h3>
            <p className="text-xs text-muted-foreground">{expenses.length}/30 items</p>
          </div>
        </div>

        {/* Add Form */}
        <div className="flex gap-2 mb-4">
          <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
            <SelectTrigger className="w-32 h-10 bg-white/[0.02] border-white/[0.08]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <cat.icon className="h-3.5 w-3.5" />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Name"
            value={newExpense.name}
            onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
            className="flex-1 h-10 bg-white/[0.02] border-white/[0.08]"
            maxLength={50}
          />
          <div className="relative w-28">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {getCurrencySymbol(currency)}
            </span>
            <Input
              type="number"
              placeholder="0"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              className="h-10 pl-6 bg-white/[0.02] border-white/[0.08]"
              min="0"
              step="0.01"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddExpense}
            disabled={!newExpense.name.trim() || !newExpense.amount || addExpense.isPending}
            className="h-10 px-3 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {expensesLoading ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">No recurring expenses yet</p>
          ) : (
            expenses.map((expense) =>
              renderItem(
                expense,
                'expense',
                editingExpense,
                setEditingExpense,
                async () => {
                  if (!editingExpense) return;
                  try {
                    await updateExpense.mutateAsync({
                      id: editingExpense.id,
                      name: editingExpense.name.trim(),
                      amount: parseFloat(editingExpense.amount),
                    });
                    setEditingExpense(null);
                    toast.success('Expense updated');
                  } catch (e) {
                    toast.error('Failed to update expense');
                  }
                },
                (id) => deleteExpense.mutate(id)
              )
            )
          )}
        </div>
      </div>

      {/* Recurring Income */}
      <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Recurring Income</h3>
            <p className="text-xs text-muted-foreground">{income.length} items</p>
          </div>
        </div>

        {/* Add Form */}
        <div className="flex gap-2 mb-4">
          <Select value={newIncome.category} onValueChange={(v) => setNewIncome({ ...newIncome, category: v })}>
            <SelectTrigger className="w-32 h-10 bg-white/[0.02] border-white/[0.08]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INCOME_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <cat.icon className="h-3.5 w-3.5" />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Name"
            value={newIncome.name}
            onChange={(e) => setNewIncome({ ...newIncome, name: e.target.value })}
            className="flex-1 h-10 bg-white/[0.02] border-white/[0.08]"
            maxLength={50}
          />
          <div className="relative w-28">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {getCurrencySymbol(currency)}
            </span>
            <Input
              type="number"
              placeholder="0"
              value={newIncome.amount}
              onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
              className="h-10 pl-6 bg-white/[0.02] border-white/[0.08]"
              min="0"
              step="0.01"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddIncome}
            disabled={!newIncome.name.trim() || !newIncome.amount || addIncome.isPending}
            className="h-10 px-3 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {incomeLoading ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : income.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">No recurring income yet</p>
          ) : (
            income.map((inc) =>
              renderItem(
                inc,
                'income',
                editingIncome,
                setEditingIncome,
                async () => {
                  if (!editingIncome) return;
                  try {
                    await updateIncome.mutateAsync({
                      id: editingIncome.id,
                      name: editingIncome.name.trim(),
                      amount: parseFloat(editingIncome.amount),
                    });
                    setEditingIncome(null);
                    toast.success('Income updated');
                  } catch (e) {
                    toast.error('Failed to update income');
                  }
                },
                (id) => deleteIncome.mutate(id)
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}