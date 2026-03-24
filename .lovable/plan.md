

# Finance Module — Complete Audit, Fixes & Improvements

## BUGS & MISSING TRANSLATIONS

### Critical: 6 Missing i18n Key Groups
The console logs confirm these keys are completely absent from both `en.json` and `fr.json`:

| Key | Used In |
|-----|---------|
| `finance.analytics.last6Months` | CategoryTrendsChart L69, L139 |
| `finance.analytics.perYear` | FinanceDashboard L192 |
| `finance.analytics.monthComparison` | MonthComparisonWidget L63 |
| `finance.analytics.noPreviousMonth` | MonthComparisonWidget L68 |
| `finance.analytics.topExpenses` | TopCategoriesBar L40 |
| `finance.analytics.incomeVsExpenses` | CategoryTrendsChart L68 |

Additionally, `finance.budgets.*` and `finance.savings.*` keys are still missing (confirmed by search returning zero results).

**Fix**: Add complete `finance.analytics`, `finance.budgets`, and `finance.savings` key blocks to both locale files.

### Bug: AnimatedNumber shows NaN briefly for negatives
In `AnimatedNumber.tsx`, the animation starts from `0` and interpolates toward `Math.abs(value)`. But on the final frame it sets `displayValue = value` (negative). The prefix logic `isPositive ? '+' : ''` doesn't add a minus sign — `formatCurrency` handles it, but during interpolation negative values show as positive amounts then jump to negative.

**Fix**: Simplify — animate `displayValue` from 0 toward `value` directly (not `Math.abs`), remove the manual sign prefix, let `formatCurrency` handle signs consistently.

### Bug: Hardcoded English text in CsvImportModal
- Line 302: `"rows skipped (invalid date or amount)"` — not translated
- Line 332: `"Choose another file"` — not translated

**Fix**: Replace with `t('finance.transactions.skippedRows', { count: skippedCount })` and `t('finance.transactions.chooseAnotherFile')`.

### Bug: ProjectionsPanel month key format mismatch
`ProjectionsPanel` uses `format(monthDate, 'yyyy-MM-01')` (with `-01`) to find validations, but `MonthlyValidationPanel` stores months as `'yyyy-MM-01'` while `MonthlyHistory` also uses `'yyyy-MM-01'`. However, `FinanceDashboard` and `CategoryTrendsChart` search validations using `format(d, 'yyyy-MM')` (without `-01`). If the DB stores `yyyy-MM-01`, the dashboard widgets will never find matches.

**Fix**: Standardize all lookups to match the DB storage format (`yyyy-MM-01`), or normalize during comparison.

### Bug: CategoryDonut dynamic class not compiled by Tailwind
Line 53: `` `from-${colorAccent}-500/[0.05]` `` — Tailwind can't generate dynamic class names at runtime.

**Fix**: Use inline style or explicit conditional classes.

---

## UX/UI IMPROVEMENTS

### 1. Transaction Table: No inline edit capability
Currently transactions can only be deleted, not edited. `useUpdateTransaction` hook exists but is unused.

**Fix**: Add an edit button alongside delete in `TransactionsTab`, opening a pre-filled `AddTransactionModal` in edit mode.

### 2. Transaction Table: No pagination
All 500 transactions render at once. With heavy CSV imports, this can lag.

**Fix**: Add a "Load more" button or virtual scrolling (show 50 at a time).

### 3. Dashboard: No empty state
When no data exists, the dashboard shows `0%`, `+€0`, and empty charts with no guidance.

**Fix**: Add a welcoming empty state with quick-start actions (add first income, add first expense, add first account).

### 4. MonthlyHistory: Edit button not working for unvalidated months
The edit button appears for validated months only. For unvalidated past months, there's no way to create a validation retroactively.

**Fix**: Show a "Validate" action for unvalidated months that opens ValidationFlowModal with that month context.

### 5. Budget Panel: No edit for existing budgets
Users can only delete and re-create budgets. No inline limit editing.

**Fix**: Add an edit button on each budget row to change the `monthly_limit`.

### 6. Savings Goal: No link to account
The `accounts` prop is passed to `SavingsGoalTracker` but never used — users can't associate a savings goal with an account.

**Fix**: Add optional account selector in the goal creation form.

---

## VISUAL/GRAPHIC IMPROVEMENTS

### 7. KPI Cards: Add micro-trend indicators
Currently just static numbers. Add a small up/down arrow comparing to last validated month.

### 8. Net Worth in Accounts tab: Add sparkline
Show a mini trend of net worth evolution based on transfer history.

### 9. Donut charts: Center label
Add total amount as a center label inside the donut for immediate readability.

### 10. Transaction table: Alternating row background
Add subtle zebra striping for better readability.

### 11. Category progress bars (BudgetProgressPanel): Gradient fill
Use category-colored gradients instead of flat color for a more premium look.

### 12. Validation Panel: Progress stepper dots
Add visual step indicators (1-2-3-4) to show progress through the validation flow.

---

## FEATURE ADDITIONS

### 13. Recurring item frequency support
Currently all items are monthly. Add frequency field: weekly, biweekly, monthly, quarterly, yearly. Adjust calculations accordingly.

### 14. Balance snapshot history
Track account balance snapshots at each month validation to build a true net worth evolution chart over time.

### 15. Quick duplicate transaction
Add a "duplicate" action on transaction rows for fast entry of similar operations.

---

## IMPLEMENTATION ORDER

| Phase | Items | Files |
|-------|-------|-------|
| **Phase 1: Fix all bugs** | Missing i18n keys, AnimatedNumber, hardcoded strings, month format mismatch, Tailwind dynamic class | `en.json`, `fr.json`, `AnimatedNumber.tsx`, `CsvImportModal.tsx`, `ProjectionsPanel.tsx`, `FinanceDashboard.tsx`, `CategoryTrendsChart.tsx`, `CategoryDonut.tsx` |
| **Phase 2: UX fixes** | Transaction edit, pagination, empty states, budget edit, unvalidated month actions | `TransactionsTab.tsx`, `AddTransactionModal.tsx`, `FinanceDashboard.tsx`, `MonthlyHistory.tsx`, `BudgetProgressPanel.tsx`, `SavingsGoalTracker.tsx` |
| **Phase 3: Visual polish** | KPI trends, donut center label, zebra rows, gradient bars, stepper dots | `FinanceDashboard.tsx`, `CategoryDonut.tsx`, `TransactionsTab.tsx`, `BudgetProgressPanel.tsx`, `ValidationFlowModal.tsx` |
| **Phase 4: Features** | Frequency support, balance snapshots, duplicate transaction | Migration (add `frequency` column), `useFinance.ts`, `FinancialBlock.tsx`, `AddItemForm.tsx`, `TransactionsTab.tsx` |

No database changes needed for Phases 1-3. Phase 4 requires one migration to add a `frequency` column to `recurring_expenses` and `recurring_income` tables.

