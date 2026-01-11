import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, TrendingDown, TrendingUp, Home, Car, Utensils, Wifi, Heart, ShoppingBag, Zap, DollarSign, Briefcase, Gift, PiggyBank, Landmark, GraduationCap, Gamepad2, Wrench, CreditCard, Receipt, Plane } from 'lucide-react';
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
  { value: 'housing', label: 'Housing', icon: Home, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { value: 'utilities', label: 'Utilities', icon: Wifi, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { value: 'food', label: 'Food', icon: Utensils, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { value: 'transport', label: 'Transport', icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { value: 'subscriptions', label: 'Subscriptions', icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { value: 'health', label: 'Health', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { value: 'leisure', label: 'Leisure', icon: Gamepad2, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { value: 'savings', label: 'Savings', icon: PiggyBank, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { value: 'taxes', label: 'Taxes', icon: Landmark, color: 'text-red-400', bg: 'bg-red-500/10' },
  { value: 'other', label: 'Other', icon: Receipt, color: 'text-slate-400', bg: 'bg-slate-500/10' },
];

const INCOME_CATEGORIES = [
  { value: 'salary', label: 'Salary', icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { value: 'freelance', label: 'Freelance', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { value: 'investment', label: 'Investment', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
  { value: 'rental', label: 'Rental', icon: Home, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { value: 'gift', label: 'Gift', icon: Gift, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { value: 'other', label: 'Other', icon: DollarSign, color: 'text-slate-400', bg: 'bg-slate-500/10' },
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

  const getCategoryDetails = (categoryValue: string, type: 'expense' | 'income') => {
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    return categories.find(c => c.value === categoryValue) || categories[categories.length - 1];
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
    const categoryDetails = getCategoryDetails('other', type);
    const Icon = categoryDetails.icon;
    
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
              className="flex-1 h-9 text-sm finance-input"
              placeholder="Name"
            />
            <Input
              type="text"
              inputMode="decimal"
              value={editing.amount}
              onChange={(e) => setEditing({ ...editing, amount: e.target.value.replace(/[^0-9.]/g, '') })}
              className="w-24 h-9 text-sm finance-input"
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
            <div className={`w-8 h-8 rounded-lg ${categoryDetails.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`h-4 w-4 ${categoryDetails.color}`} />
            </div>
            <span className="flex-1 text-sm font-medium text-white truncate">
              {item.name}
            </span>
            <span className={`font-semibold text-sm tabular-nums ${
              type === 'expense' ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {type === 'expense' ? '-' : '+'}{formatCurrency(item.amount, currency)}
            </span>
            <button
              onClick={() => setEditing({ id: item.id, name: item.name, amount: item.amount.toString() })}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Net Balance Summary */}
      <div className="finance-card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">Monthly Balance</h3>
          <span className={`text-xl font-semibold tabular-nums ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance, currency)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10">
            <p className="text-xs text-emerald-400/80 font-medium mb-1.5 uppercase tracking-wider">Income</p>
            <p className="text-lg font-semibold text-emerald-400 tabular-nums">
              +{formatCurrency(totalIncome, currency)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-rose-500/[0.04] border border-rose-500/10">
            <p className="text-xs text-rose-400/80 font-medium mb-1.5 uppercase tracking-wider">Expenses</p>
            <p className="text-lg font-semibold text-rose-400 tabular-nums">
              -{formatCurrency(totalExpenses, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Recurring Expenses */}
      <div className="finance-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">Recurring Expenses</h3>
            <p className="text-xs text-slate-500">{expenses.length}/30</p>
          </div>
        </div>

        {/* Add Form */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Expense name"
            value={newExpense.name}
            onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
            className="flex-1 h-10 finance-input"
            maxLength={50}
          />
          <div className="relative w-28">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              {getCurrencySymbol(currency)}
            </span>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value.replace(/[^0-9.]/g, '') })}
              className="h-10 pl-6 finance-input"
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
        <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin">
          {expensesLoading ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No recurring expenses yet</p>
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
      <div className="finance-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">Recurring Income</h3>
            <p className="text-xs text-slate-500">{income.length} sources</p>
          </div>
        </div>

        {/* Add Form */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Income source"
            value={newIncome.name}
            onChange={(e) => setNewIncome({ ...newIncome, name: e.target.value })}
            className="flex-1 h-10 finance-input"
            maxLength={50}
          />
          <div className="relative w-28">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              {getCurrencySymbol(currency)}
            </span>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={newIncome.amount}
              onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value.replace(/[^0-9.]/g, '') })}
              className="h-10 pl-6 finance-input"
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
        <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin">
          {incomeLoading ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : income.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No recurring income yet</p>
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
