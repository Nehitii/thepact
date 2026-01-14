import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Home, Car, Utensils, Wifi, Heart, ShoppingBag, PiggyBank, Landmark, GraduationCap, Gamepad2, Wrench, CreditCard, Receipt, Plane, Zap, DollarSign, Briefcase, Gift } from 'lucide-react';
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
} from '@/hooks/useFinance';
import { toast } from 'sonner';
import { MonthlyBalanceHero } from './MonthlyBalanceHero';
import { FinancialBlock } from './FinancialBlock';
import { MonthlyValidationPanel } from './MonthlyValidationPanel';
import { MonthlyHistory } from './MonthlyHistory';

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
  { value: 'education', label: 'Education', icon: GraduationCap, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { value: 'travel', label: 'Travel', icon: Plane, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { value: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-500/10' },
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

interface MonthlyDashboardProps {
  salaryPaymentDay: number;
}

// Category color mapping for charts
const EXPENSE_COLORS: Record<string, string> = {
  housing: '#fb7185',
  utilities: '#fb923c',
  food: '#facc15',
  transport: '#60a5fa',
  subscriptions: '#c084fc',
  health: '#f472b6',
  leisure: '#22d3ee',
  savings: '#34d399',
  taxes: '#f87171',
  education: '#818cf8',
  travel: '#38bdf8',
  shopping: '#a78bfa',
  maintenance: '#fbbf24',
  other: '#94a3b8',
};

const INCOME_COLORS: Record<string, string> = {
  salary: '#34d399',
  freelance: '#facc15',
  investment: '#4ade80',
  rental: '#60a5fa',
  gift: '#f472b6',
  other: '#94a3b8',
};

export function MonthlyDashboard({ salaryPaymentDay }: MonthlyDashboardProps) {
  const { user } = useAuth();
  
  const { data: expenses = [], isLoading: expensesLoading } = useRecurringExpenses(user?.id);
  const { data: income = [], isLoading: incomeLoading } = useRecurringIncome(user?.id);
  
  const addExpense = useAddRecurringExpense();
  const addIncome = useAddRecurringIncome();
  const updateExpense = useUpdateRecurringExpense();
  const updateIncome = useUpdateRecurringIncome();
  const deleteExpense = useDeleteRecurringExpense();
  const deleteIncome = useDeleteRecurringIncome();

  const totalExpenses = expenses.filter(e => e.is_active).reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = income.filter(i => i.is_active).reduce((sum, i) => sum + i.amount, 0);

  // Compute expenses by category for pie chart
  const expensesByCategory = useMemo(() => {
    const activeExpenses = expenses.filter(e => e.is_active);
    const categoryTotals: Record<string, number> = {};
    
    activeExpenses.forEach(exp => {
      const cat = exp.category || 'other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
    });
    
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name: EXPENSE_CATEGORIES.find(c => c.value === name)?.label || name,
        value,
        color: EXPENSE_COLORS[name] || EXPENSE_COLORS.other,
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Compute income by category for pie chart
  const incomeByCategory = useMemo(() => {
    const activeIncome = income.filter(i => i.is_active);
    const categoryTotals: Record<string, number> = {};
    
    activeIncome.forEach(inc => {
      const cat = inc.category || 'other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + inc.amount;
    });
    
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name: INCOME_CATEGORIES.find(c => c.value === name)?.label || name,
        value,
        color: INCOME_COLORS[name] || INCOME_COLORS.other,
      }))
      .sort((a, b) => b.value - a.value);
  }, [income]);

  const handleAddExpense = async (name: string, amount: number, category?: string) => {
    if (expenses.length >= 30) {
      toast.error('Maximum 30 recurring expenses allowed');
      return;
    }
    try {
      await addExpense.mutateAsync({ name, amount, category });
      toast.success('Expense added');
    } catch (e) {
      toast.error('Failed to add expense');
    }
  };

  const handleAddIncome = async (name: string, amount: number, category?: string) => {
    try {
      await addIncome.mutateAsync({ name, amount, category });
      toast.success('Income added');
    } catch (e) {
      toast.error('Failed to add income');
    }
  };

  const handleUpdateExpense = async (id: string, name: string, amount: number, category?: string) => {
    try {
      await updateExpense.mutateAsync({ id, name, amount, category });
      toast.success('Expense updated');
    } catch (e) {
      toast.error('Failed to update expense');
    }
  };

  const handleUpdateIncome = async (id: string, name: string, amount: number, category?: string) => {
    try {
      await updateIncome.mutateAsync({ id, name, amount, category });
      toast.success('Income updated');
    } catch (e) {
      toast.error('Failed to update income');
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero: Monthly Balance with Pie Charts */}
      <MonthlyBalanceHero 
        totalIncome={totalIncome} 
        totalExpenses={totalExpenses}
        expensesByCategory={expensesByCategory}
        incomeByCategory={incomeByCategory}
      />
      {/* Two Column Layout: Expenses | Income */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses Block */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <FinancialBlock
            title="Recurring Expenses"
            type="expense"
            items={expenses}
            categories={EXPENSE_CATEGORIES}
            isLoading={expensesLoading}
            onAdd={handleAddExpense}
            onUpdate={handleUpdateExpense}
            onDelete={(id) => deleteExpense.mutate(id)}
            isPending={addExpense.isPending}
          />
        </motion.div>

        {/* Income Block */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <FinancialBlock
            title="Recurring Income"
            type="income"
            items={income}
            categories={INCOME_CATEGORIES}
            isLoading={incomeLoading}
            onAdd={handleAddIncome}
            onUpdate={handleUpdateIncome}
            onDelete={(id) => deleteIncome.mutate(id)}
            isPending={addIncome.isPending}
          />
        </motion.div>
      </div>

      {/* Validation Panel */}
      <MonthlyValidationPanel salaryPaymentDay={salaryPaymentDay} />

      {/* Monthly History - Collapsed by default */}
      <MonthlyHistory />
    </div>
  );
}
