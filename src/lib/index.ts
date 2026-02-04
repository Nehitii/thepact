/**
 * Library utilities barrel export.
 * Import utilities from this index for cleaner imports.
 */
export { supabase, getUserPact, createPact, updatePactProgress } from "./supabase";
export { formatCurrency, getCurrencySymbol, getCurrencyPosition } from "./currency";
export {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getCategoryLabel,
  getCategoryByValue,
  getExpenseCategory,
  getIncomeCategory,
  detectCategoryFromName,
  getItemCategory,
  calculateActiveTotal,
  groupItemsByCategory,
  getCategoryTotals,
} from "./financeCategories";
export type { FinanceCategory } from "./financeCategories";
export {
  GOAL_TAGS,
  DIFFICULTY_OPTIONS,
  STATUS_CONFIG,
  DIFFICULTY_ORDER,
  getTagLabel,
  getTagColor,
  getDifficultyLabel,
  getStatusLabel,
  getStatusBadgeClass,
} from "./goalConstants";
export { cn, getDifficultyColor } from "./utils";
