import {
  Home, Car, Utensils, Wifi, Heart, ShoppingBag, PiggyBank, Landmark, 
  GraduationCap, Gamepad2, Wrench, CreditCard, Receipt, Plane, Zap, 
  DollarSign, Briefcase, Gift, TrendingUp
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TFunction } from 'i18next';

// ============================================
// SHARED FINANCE CATEGORY CONFIGURATION
// ============================================

export interface FinanceCategory {
  value: string;
  labelKey: string;      // Translation key for i18n
  icon: LucideIcon;
  color: string;         // Tailwind text color class
  bg: string;            // Tailwind bg color class
  hexColor: string;      // Hex color for charts/inline styles
}

// Expense Categories - Single source of truth
export const EXPENSE_CATEGORIES: FinanceCategory[] = [
  { value: 'housing', labelKey: 'finance.categories.housing', icon: Home, color: 'text-rose-400', bg: 'bg-rose-500/10', hexColor: '#fb7185' },
  { value: 'utilities', labelKey: 'finance.categories.utilities', icon: Wifi, color: 'text-orange-400', bg: 'bg-orange-500/10', hexColor: '#fb923c' },
  { value: 'food', labelKey: 'finance.categories.food', icon: Utensils, color: 'text-yellow-400', bg: 'bg-yellow-500/10', hexColor: '#facc15' },
  { value: 'transport', labelKey: 'finance.categories.transport', icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10', hexColor: '#60a5fa' },
  { value: 'subscriptions', labelKey: 'finance.categories.subscriptions', icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10', hexColor: '#c084fc' },
  { value: 'health', labelKey: 'finance.categories.health', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', hexColor: '#f472b6' },
  { value: 'leisure', labelKey: 'finance.categories.leisure', icon: Gamepad2, color: 'text-cyan-400', bg: 'bg-cyan-500/10', hexColor: '#22d3ee' },
  { value: 'savings', labelKey: 'finance.categories.savings', icon: PiggyBank, color: 'text-emerald-400', bg: 'bg-emerald-500/10', hexColor: '#34d399' },
  { value: 'taxes', labelKey: 'finance.categories.taxes', icon: Landmark, color: 'text-red-400', bg: 'bg-red-500/10', hexColor: '#f87171' },
  { value: 'education', labelKey: 'finance.categories.education', icon: GraduationCap, color: 'text-indigo-400', bg: 'bg-indigo-500/10', hexColor: '#818cf8' },
  { value: 'travel', labelKey: 'finance.categories.travel', icon: Plane, color: 'text-sky-400', bg: 'bg-sky-500/10', hexColor: '#38bdf8' },
  { value: 'shopping', labelKey: 'finance.categories.shopping', icon: ShoppingBag, color: 'text-violet-400', bg: 'bg-violet-500/10', hexColor: '#a78bfa' },
  { value: 'maintenance', labelKey: 'finance.categories.maintenance', icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-500/10', hexColor: '#fbbf24' },
  { value: 'insurance', labelKey: 'finance.categories.insurance', icon: Receipt, color: 'text-teal-400', bg: 'bg-teal-500/10', hexColor: '#2dd4bf' },
  { value: 'childcare', labelKey: 'finance.categories.childcare', icon: Heart, color: 'text-rose-300', bg: 'bg-rose-300/10', hexColor: '#fda4af' },
  { value: 'pets', labelKey: 'finance.categories.pets', icon: Heart, color: 'text-orange-300', bg: 'bg-orange-300/10', hexColor: '#fdba74' },
  { value: 'gifts', labelKey: 'finance.categories.gifts', icon: Gift, color: 'text-pink-300', bg: 'bg-pink-300/10', hexColor: '#f9a8d4' },
  { value: 'debt', labelKey: 'finance.categories.debt', icon: CreditCard, color: 'text-red-500', bg: 'bg-red-500/10', hexColor: '#ef4444' },
  { value: 'entertainment', labelKey: 'finance.categories.entertainment', icon: Gamepad2, color: 'text-violet-300', bg: 'bg-violet-300/10', hexColor: '#c4b5fd' },
  { value: 'other', labelKey: 'finance.categories.other', icon: Receipt, color: 'text-slate-400', bg: 'bg-slate-500/10', hexColor: '#94a3b8' },
];

// Income Categories - Single source of truth
export const INCOME_CATEGORIES: FinanceCategory[] = [
  { value: 'salary', labelKey: 'finance.categories.salary', icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-500/10', hexColor: '#34d399' },
  { value: 'freelance', labelKey: 'finance.categories.freelance', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', hexColor: '#facc15' },
  { value: 'business', labelKey: 'finance.categories.business', icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10', hexColor: '#60a5fa' },
  { value: 'investments', labelKey: 'finance.categories.investments', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10', hexColor: '#4ade80' },
  { value: 'rental', labelKey: 'finance.categories.rental', icon: Home, color: 'text-blue-400', bg: 'bg-blue-500/10', hexColor: '#60a5fa' },
  { value: 'bonus', labelKey: 'finance.categories.bonus', icon: Gift, color: 'text-amber-400', bg: 'bg-amber-500/10', hexColor: '#fbbf24' },
  { value: 'pension', labelKey: 'finance.categories.pension', icon: PiggyBank, color: 'text-teal-400', bg: 'bg-teal-500/10', hexColor: '#2dd4bf' },
  { value: 'benefits', labelKey: 'finance.categories.benefits', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', hexColor: '#f472b6' },
  { value: 'royalties', labelKey: 'finance.categories.royalties', icon: DollarSign, color: 'text-purple-400', bg: 'bg-purple-500/10', hexColor: '#c084fc' },
  { value: 'refunds', labelKey: 'finance.categories.refunds', icon: Receipt, color: 'text-cyan-400', bg: 'bg-cyan-500/10', hexColor: '#22d3ee' },
  { value: 'gift', labelKey: 'finance.categories.gift', icon: Gift, color: 'text-pink-400', bg: 'bg-pink-500/10', hexColor: '#f472b6' },
  { value: 'other', labelKey: 'finance.categories.other', icon: DollarSign, color: 'text-slate-400', bg: 'bg-slate-500/10', hexColor: '#94a3b8' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get translated label for a category
 */
export function getCategoryLabel(category: FinanceCategory, t?: TFunction): string {
  if (t) return t(category.labelKey);
  // Fallback to English
  const fallbacks: Record<string, string> = {
    housing: 'Housing', utilities: 'Utilities', food: 'Food', transport: 'Transport',
    subscriptions: 'Subscriptions', health: 'Health', leisure: 'Leisure', savings: 'Savings',
    taxes: 'Taxes', education: 'Education', travel: 'Travel', shopping: 'Shopping',
    maintenance: 'Maintenance', insurance: 'Insurance', childcare: 'Childcare', pets: 'Pets',
    gifts: 'Gifts', debt: 'Debt', entertainment: 'Entertainment', other: 'Other',
    salary: 'Salary', freelance: 'Freelance', business: 'Business', investments: 'Investments',
    rental: 'Rental', bonus: 'Bonus', pension: 'Pension', benefits: 'Benefits',
    royalties: 'Royalties', refunds: 'Refunds', gift: 'Gift',
  };
  return fallbacks[category.value] || category.value.charAt(0).toUpperCase() + category.value.slice(1);
}

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
  housing: ['rent', 'mortgage', 'housing', 'apartment', 'lease', 'hoa', 'loyer', 'hypothèque', 'logement'],
  utilities: ['electric', 'water', 'gas', 'utility', 'internet', 'wifi', 'phone', 'mobile', 'cable', 'électricité', 'eau', 'gaz', 'téléphone'],
  transport: ['car', 'auto', 'fuel', 'transport', 'metro', 'bus', 'uber', 'lyft', 'parking', 'voiture', 'essence', 'métro'],
  food: ['food', 'grocery', 'groceries', 'restaurant', 'dining', 'meal', 'lunch', 'dinner', 'breakfast', 'nourriture', 'courses', 'repas'],
  health: ['health', 'medical', 'doctor', 'dentist', 'pharmacy', 'medicine', 'gym', 'fitness', 'santé', 'médecin', 'dentiste', 'pharmacie'],
  subscriptions: ['netflix', 'spotify', 'subscription', 'streaming', 'premium', 'plus', 'membership', 'abonnement'],
  entertainment: ['entertainment', 'movie', 'game', 'concert', 'event', 'hobby', 'divertissement', 'film', 'jeu'],
  education: ['education', 'course', 'school', 'college', 'tuition', 'book', 'learning', 'éducation', 'cours', 'école', 'livre'],
  shopping: ['shopping', 'clothes', 'amazon', 'retail', 'purchase', 'vêtements', 'achat'],
  savings: ['saving', 'investment', 'invest', '401k', 'ira', 'retirement', 'épargne', 'investissement', 'retraite'],
  debt: ['debt', 'loan', 'credit', 'payment', 'interest', 'dette', 'prêt', 'crédit', 'intérêt'],
  insurance: ['insurance', 'policy', 'coverage', 'assurance'],
  childcare: ['child', 'daycare', 'babysit', 'kid', 'enfant', 'garde'],
  pets: ['pet', 'dog', 'cat', 'vet', 'animal', 'chien', 'chat', 'vétérinaire'],
  gifts: ['gift', 'donation', 'charity', 'present', 'cadeau', 'don'],
  taxes: ['tax', 'irs', 'federal', 'state', 'impôt', 'taxe'],
  leisure: ['leisure', 'fun', 'recreation', 'loisir'],
  travel: ['travel', 'vacation', 'trip', 'flight', 'hotel', 'voyage', 'vacances', 'vol', 'hôtel'],
  maintenance: ['maintenance', 'repair', 'fix', 'entretien', 'réparation'],
  // Income
  salary: ['salary', 'paycheck', 'wage', 'pay', 'salaire', 'paie'],
  freelance: ['freelance', 'contract', 'consulting', 'gig', 'indépendant', 'contrat'],
  business: ['business', 'profit', 'revenue', 'sales', 'affaires', 'bénéfice', 'ventes'],
  investments: ['dividend', 'investment', 'stock', 'bond', 'capital', 'dividende', 'action', 'obligation'],
  rental: ['rental', 'tenant', 'property', 'location', 'locataire'],
  bonus: ['bonus', 'commission', 'incentive', 'prime'],
  pension: ['pension', 'social security', 'retraite'],
  benefits: ['benefit', 'subsidy', 'allowance', 'stipend', 'allocation', 'aide'],
  royalties: ['royalty', 'royalties', 'licensing', 'redevance'],
  refunds: ['refund', 'rebate', 'cashback', 'return', 'remboursement'],
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
 * Get category totals for charts (with i18n support)
 */
export function getCategoryTotals<T extends { category?: string | null; name: string; amount: number; is_active: boolean }>(
  items: T[],
  categories: FinanceCategory[],
  t?: TFunction
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
        label: getCategoryLabel(cat, t),
        value: total,
        color: cat.hexColor,
        icon: cat.icon,
      };
    })
    .sort((a, b) => b.value - a.value);
}
