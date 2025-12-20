import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface EditingItem {
  id: string;
  name: string;
  amount: string;
}

export function RecurringManager() {
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

  const [newExpense, setNewExpense] = useState({ name: '', amount: '' });
  const [newIncome, setNewIncome] = useState({ name: '', amount: '' });
  const [editingExpense, setEditingExpense] = useState<EditingItem | null>(null);
  const [editingIncome, setEditingIncome] = useState<EditingItem | null>(null);

  const totalExpenses = expenses.filter(e => e.is_active).reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = income.filter(i => i.is_active).reduce((sum, i) => sum + i.amount, 0);

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
      setNewExpense({ name: '', amount: '' });
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
      setNewIncome({ name: '', amount: '' });
      toast.success('Income added');
    } catch (e) {
      toast.error('Failed to add income');
    }
  };

  const handleSaveExpenseEdit = async () => {
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
  };

  const handleSaveIncomeEdit = async () => {
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
    
    return (
      <div 
        key={item.id}
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
          item.is_active
            ? 'bg-card/20 border-primary/20 hover:border-primary/40'
            : 'bg-card/10 border-muted/20 opacity-60'
        }`}
      >
        {isEditing ? (
          <>
            <Input
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="flex-1 h-8 text-sm"
              placeholder="Name"
            />
            <Input
              type="number"
              value={editing.amount}
              onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
              className="w-24 h-8 text-sm"
              placeholder="Amount"
            />
            <button
              onClick={onSave}
              className="p-1.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditing(null)}
              className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 font-rajdhani text-foreground truncate">
              {item.name}
            </span>
            <span className={`font-orbitron text-sm ${
              type === 'expense' ? 'text-red-400' : 'text-green-400'
            }`}>
              {type === 'expense' ? '-' : '+'}{formatCurrency(item.amount, currency)}
            </span>
            <button
              onClick={() => setEditing({ id: item.id, name: item.name, amount: item.amount.toString() })}
              className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recurring Expenses */}
      <div className="relative">
        <div className="absolute inset-0 bg-red-500/5 rounded-xl blur-xl opacity-50" />
        <div className="relative bg-card/30 backdrop-blur-xl border-2 border-red-500/30 rounded-xl p-5 h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                <TrendingDown className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <h3 className="font-orbitron font-bold text-red-400 tracking-wider text-sm">
                  RECURRING EXPENSES
                </h3>
                <p className="text-xs text-muted-foreground font-rajdhani">
                  {expenses.length}/30 items
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-rajdhani">Total</p>
              <p className="font-orbitron text-red-400 font-bold">
                -{formatCurrency(totalExpenses, currency)}
              </p>
            </div>
          </div>

          {/* Add new expense */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Name (e.g., Netflix)"
              value={newExpense.name}
              onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
              className="flex-1 h-9 text-sm bg-card/50"
              maxLength={50}
            />
            <div className="relative w-28">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="h-9 text-sm pl-6 bg-card/50"
                min="0"
                step="0.01"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddExpense}
              disabled={!newExpense.name.trim() || !newExpense.amount || addExpense.isPending}
              className="h-9 px-3 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {expensesLoading ? (
              <p className="text-center text-muted-foreground text-sm py-4">Loading...</p>
            ) : expenses.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">No recurring expenses yet</p>
            ) : (
              expenses.map((expense) =>
                renderItem(
                  expense,
                  'expense',
                  editingExpense,
                  setEditingExpense,
                  handleSaveExpenseEdit,
                  (id) => deleteExpense.mutate(id)
                )
              )
            )}
          </div>
        </div>
      </div>

      {/* Recurring Income */}
      <div className="relative">
        <div className="absolute inset-0 bg-green-500/5 rounded-xl blur-xl opacity-50" />
        <div className="relative bg-card/30 backdrop-blur-xl border-2 border-green-500/30 rounded-xl p-5 h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <h3 className="font-orbitron font-bold text-green-400 tracking-wider text-sm">
                  RECURRING INCOME
                </h3>
                <p className="text-xs text-muted-foreground font-rajdhani">
                  {income.length} items
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-rajdhani">Total</p>
              <p className="font-orbitron text-green-400 font-bold">
                +{formatCurrency(totalIncome, currency)}
              </p>
            </div>
          </div>

          {/* Add new income */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Name (e.g., Salary)"
              value={newIncome.name}
              onChange={(e) => setNewIncome({ ...newIncome, name: e.target.value })}
              className="flex-1 h-9 text-sm bg-card/50"
              maxLength={50}
            />
            <div className="relative w-28">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={newIncome.amount}
                onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                className="h-9 text-sm pl-6 bg-card/50"
                min="0"
                step="0.01"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddIncome}
              disabled={!newIncome.name.trim() || !newIncome.amount || addIncome.isPending}
              className="h-9 px-3 border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {incomeLoading ? (
              <p className="text-center text-muted-foreground text-sm py-4">Loading...</p>
            ) : income.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">No recurring income yet</p>
            ) : (
              income.map((inc) =>
                renderItem(
                  inc,
                  'income',
                  editingIncome,
                  setEditingIncome,
                  handleSaveIncomeEdit,
                  (id) => deleteIncome.mutate(id)
                )
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
