import {
  Home, Car, Utensils, Wifi, Heart, ShoppingBag, PiggyBank, Landmark, 
  GraduationCap, Gamepad2, Wrench, CreditCard, Receipt, Plane, Zap, 
  DollarSign, Briefcase, Gift, TrendingUp
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ============================================
// SHARED FINANCE CATEGORY CONFIGURATION
// ============================================

export interface FinanceCategory {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;        // Tailwind text color class
  bg: string;           // Tailwind bg color class
  hexColor: string;     // Hex color for charts/inline styles
}

// Expense Categories - Single source of truth
export const EXPENSE_CATEGORIES: FinanceCategory[] = [
  { value: 'housing', label: 'Housing', icon: Home, color: 'text-rose-400', bg: 'bg-rose-500/10', hexColor: '#fb7185' },
  { value: 'utilities', label: 'Utilities', icon: Wifi, color: 'text-orange-400', bg: 'bg-orange-500/10', hexColor: '#fb923c' },
  { value: 'food', label: 'Food', icon: Utensils, color: 'text-yellow-400', bg: 'bg-yellow-500/10', hexColor: '#facc15' },
  { value: 'transport', label: 'Transport', icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10', hexColor: '#60a5fa' },
  { value: 'subscriptions', label: 'Subscriptions', icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10', hexColor: '#c084fc' },
  { value: 'health', label: 'Health', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', hexColor: '#f472b6' },
  { value: 'leisure', label: 'Leisure', icon: Gamepad2, color: 'text-cyan-400', bg: 'bg-cyan-500/10', hexColor: '#22d3ee' },
  { value: 'savings', label: 'Savings', icon: PiggyBank, color: 'text-emerald-400', bg: 'bg-emerald-500/10', hexColor: '#34d399' },
  { value: 'taxes', label: 'Taxes', icon: Landmark, color: 'text-red-400', bg: 'bg-red-500/10', hexColor: '#f87171' },
  { value: 'education', label: 'Education', icon: GraduationCap, color: 'text-indigo-400', bg: 'bg-indigo-500/10', hexColor: '#818cf8' },
  { value: 'travel', label: 'Travel', icon: Plane, color: 'text-sky-400', bg: 'bg-sky-500/10', hexColor: '#38bdf8' },
  { value: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'text-violet-400', bg: 'bg-violet-500/10', hexColor: '#a78bfa' },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-500/10', hexColor: '#fbbf24' },
  { value: 'insurance', label: 'Insurance', icon: Receipt, color: 'text-teal-400', bg: 'bg-teal-500/10', hexColor: '#2dd4bf' },
  { value: 'childcare', label: 'Childcare', icon: Heart, color: 'text-rose-300', bg: 'bg-rose-300/10', hexColor: '#fda4af' },
  { value: 'pets', label: 'Pets', icon: Heart, color: 'text-orange-300', bg: 'bg-orange-300/10', hexColor: '#fdba74' },
  { value: 'gifts', label: 'Gifts', icon: Gift, color: 'text-pink-300', bg: 'bg-pink-300/10', hexColor: '#f9a8d4' },
  { value: 'debt', label: 'Debt', icon: CreditCard, color: 'text-red-500', bg: 'bg-red-500/10', hexColor: '#ef4444' },
  { value: 'entertainment', label: 'Entertainment', icon: Gamepad2, color: 'text-violet-300', bg: 'bg-violet-300/10', hexColor: '#c4b5fd' },
  { value: 'other', label: 'Other', icon: Receipt, color: 'text-slate-400', bg: 'bg-slate-500/10', hexColor: '#94a3b8' },
];

// Income Categories - Single source of truth
export const INCOME_CATEGORIES: FinanceCategory[] = [
  { value: 'salary', label: 'Salary', icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-500/10', hexColor: '#34d399' },
  { value: 'freelance', label: 'Freelance', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', hexColor: '#facc15' },
  { value: 'business', label: 'Business', icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10', hexColor: '#60a5fa' },
  { value: 'investments', label: 'Investments', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10', hexColor: '#4ade80' },
  { value: 'rental', label: 'Rental', icon: Home, color: 'text-blue-400', bg: 'bg-blue-500/10', hexColor: '#60a5fa' },
  { value: 'bonus', label: 'Bonus', icon: Gift, color: 'text-amber-400', bg: 'bg-amber-500/10', hexColor: '#fbbf24' },
  { value: 'pension', label: 'Pension', icon: PiggyBank, color: 'text-teal-400', bg: 'bg-teal-500/10', hexColor: '#2dd4bf' },
  { value: 'benefits', label: 'Benefits', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', hexColor: '#f472b6' },
  { value: 'royalties', label: 'Royalties', icon: DollarSign, color: 'text-purple-400', bg: 'bg-purple-500/10', hexColor: '#c084fc' },
  { value: 'refunds', label: 'Refunds', icon: Receipt, color: 'text-cyan-400', bg: 'bg-cyan-500/10', hexColor: '#22d3ee' },
  { value: 'gift', label: 'Gift', icon: Gift, color: 'text-pink-400', bg: 'bg-pink-500/10', hexColor: '#f472b6' },
  { value: 'other', label: 'Other', icon: DollarSign, color: 'text-slate-400', bg: 'bg-slate-500/10', hexColor: '#94a3b8' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a category by value from a categories list
 */
export function getCategoryByValue(value: string | null | undefined, categories: FinanceCategory[]): FinanceCategory {
  if (!value) return categories.find(c => c.value === 'other') || categories[categories.length - 1];
  return categories.find(c => c.value === value) || categories.find(c => c.value === 'other') || categories[categories.length - 1];
}

/**
 * Get expense category by value
 */
export function getExpenseCategory(value: string | null | undefined): FinanceCategory {
  return getCategoryByValue(value, EXPENSE_CATEGORIES);
}

/**
 * Get income category by value
 */
export function getIncomeCategory(value: string | null | undefined): FinanceCategory {
  return getCategoryByValue(value, INCOME_CATEGORIES);
}

/**
 * Keyword map for auto-detecting category from item name
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // Expenses
  housing: ['rent', 'mortgage', 'housing', 'apartment', 'lease', 'hoa'],
  utilities: ['electric', 'water', 'gas', 'utility', 'internet', 'wifi', 'phone', 'mobile', 'cable'],
  transport: ['car', 'auto', 'fuel', 'transport', 'metro', 'bus', 'uber', 'lyft', 'parking'],
  food: ['food', 'grocery', 'groceries', 'restaurant', 'dining', 'meal', 'lunch', 'dinner', 'breakfast'],
  health: ['health', 'medical', 'doctor', 'dentist', 'pharmacy', 'medicine', 'gym', 'fitness'],
  subscriptions: ['netflix', 'spotify', 'subscription', 'streaming', 'premium', 'plus', 'membership'],
  entertainment: ['entertainment', 'movie', 'game', 'concert', 'event', 'hobby'],
  education: ['education', 'course', 'school', 'college', 'tuition', 'book', 'learning'],
  shopping: ['shopping', 'clothes', 'amazon', 'retail', 'purchase'],
  savings: ['saving', 'investment', 'invest', '401k', 'ira', 'retirement'],
  debt: ['debt', 'loan', 'credit', 'payment', 'interest'],
  insurance: ['insurance', 'policy', 'coverage'],
  childcare: ['child', 'daycare', 'babysit', 'kid'],
  pets: ['pet', 'dog', 'cat', 'vet', 'animal'],
  gifts: ['gift', 'donation', 'charity', 'present'],
  taxes: ['tax', 'irs', 'federal', 'state'],
  leisure: ['leisure', 'fun', 'recreation'],
  travel: ['travel', 'vacation', 'trip', 'flight', 'hotel'],
  maintenance: ['maintenance', 'repair', 'fix'],
  // Income
  salary: ['salary', 'paycheck', 'wage', 'pay'],
  freelance: ['freelance', 'contract', 'consulting', 'gig'],
  business: ['business', 'profit', 'revenue', 'sales'],
  investments: ['dividend', 'investment', 'stock', 'bond', 'capital'],
  rental: ['rental', 'tenant', 'property'],
  bonus: ['bonus', 'commission', 'incentive'],
  pension: ['pension', 'social security'],
  benefits: ['benefit', 'subsidy', 'allowance', 'stipend'],
  royalties: ['royalty', 'royalties', 'licensing'],
  refunds: ['refund', 'rebate', 'cashback', 'return'],
};

/**
 * Auto-detect category from item name
 */
export function detectCategoryFromName(itemName: string, categories: FinanceCategory[]): FinanceCategory {
  const lowerName = itemName.toLowerCase();
  
  for (const [categoryValue, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      const found = categories.find(c => c.value === categoryValue);
      if (found) return found;
    }
  }
  
  return categories.find(c => c.value === 'other') || categories[categories.length - 1];
}

/**
 * Get category for an item - use stored category or fall back to auto-detection
 */
export function getItemCategory<T extends { category?: string | null; name: string }>(
  item: T, 
  categories: FinanceCategory[]
): FinanceCategory {
  if (item.category) {
    const found = categories.find(c => c.value === item.category);
    if (found) return found;
  }
  return detectCategoryFromName(item.name, categories);
}

/**
 * Calculate total from active items
 */
export function calculateActiveTotal<T extends { is_active: boolean; amount: number }>(items: T[]): number {
  return items.filter(i => i.is_active).reduce((sum, i) => sum + i.amount, 0);
}

/**
 * Group items by category
 */
export function groupItemsByCategory<T extends { category?: string | null; name: string }>(
  items: T[],
  categories: FinanceCategory[]
): Map<string, { category: FinanceCategory; items: T[] }> {
  const groups = new Map<string, { category: FinanceCategory; items: T[] }>();
  
  items.forEach(item => {
    const category = getItemCategory(item, categories);
    const existing = groups.get(category.value);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(category.value, { category, items: [item] });
    }
  });
  
  return groups;
}

/**
 * Get category totals for charts
 */
export function getCategoryTotals<T extends { category?: string | null; name: string; amount: number; is_active: boolean }>(
  items: T[],
  categories: FinanceCategory[]
): Array<{ name: string; label: string; value: number; color: string; icon: LucideIcon }> {
  const activeItems = items.filter(i => i.is_active);
  const categoryTotals: Record<string, number> = {};
  
  activeItems.forEach(item => {
    const cat = getItemCategory(item, categories);
    categoryTotals[cat.value] = (categoryTotals[cat.value] || 0) + item.amount;
  });
  
  return Object.entries(categoryTotals)
    .map(([value, total]) => {
      const cat = getCategoryByValue(value, categories);
      return {
        name: value,
        label: cat.label,
        value: total,
        color: cat.hexColor,
        icon: cat.icon,
      };
    })
    .sort((a, b) => b.value - a.value);
}
