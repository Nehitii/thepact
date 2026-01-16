// ============================================
// SHARED FINANCE TYPES
// ============================================

import type { LucideIcon } from 'lucide-react';

/**
 * Recurring expense item
 */
export interface RecurringExpense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  is_active: boolean;
  category?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Recurring income item
 */
export interface RecurringIncome {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  is_active: boolean;
  category?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Monthly validation record
 */
export interface MonthlyValidation {
  id: string;
  user_id: string;
  month: string;
  confirmed_expenses: boolean;
  confirmed_income: boolean;
  unplanned_expenses: number;
  unplanned_income: number;
  actual_total_income: number;
  actual_total_expenses: number;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Finance settings from profile
 */
export interface FinanceSettings {
  salary_payment_day: number;
  project_funding_target: number;
  project_monthly_allocation: number;
  already_funded: number;
}

/**
 * Category data for charts
 */
export interface CategoryChartData {
  name: string;
  label: string;
  value: number;
  color: string;
  icon?: LucideIcon;
}

/**
 * Balance trend data point
 */
export interface BalanceTrendPoint {
  month: string;
  label: string;
  balance: number;
}

/**
 * Financial item (generic for expense/income)
 */
export interface FinancialItem {
  id: string;
  name: string;
  amount: number;
  is_active: boolean;
  category?: string | null;
}

/**
 * Props for FinancialBlock component
 */
export interface FinancialBlockProps {
  title: string;
  type: 'expense' | 'income';
  items: FinancialItem[];
  categories: import('@/lib/financeCategories').FinanceCategory[];
  isLoading: boolean;
  onAdd: (name: string, amount: number, category?: string) => Promise<void>;
  onUpdate: (id: string, name: string, amount: number, category?: string) => Promise<void>;
  onDelete: (id: string) => void;
  isPending?: boolean;
}

/**
 * Stats summary for projections
 */
export interface FinanceStats {
  savingsRate: number;
  monthsToGoal: number | null;
  monthlyNet: number;
  yearlyProjection: number;
}
