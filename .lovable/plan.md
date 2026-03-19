

# Finance Module — Full Audit & Improvement Plan

## Current State Summary

The Finance module has 4 tabs (Dashboard, Budget, Accounts, Planner) with recurring expense/income tracking, monthly validation, bank accounts with transfer simulator, and projections. The codebase is well-structured but has several bugs, UX gaps, and mobile responsiveness issues.

---

## MISSION 1: Audit & Corrections

### Bug Fixes

| # | Severity | Issue | Location | Fix |
|---|----------|-------|----------|-----|
| 1 | Critical | **AddAccountModal doesn't reset fields** when opening for a new account after editing one. `useState` initializers run once — stale data persists. | `AddAccountModal.tsx` L39-44 | Add `useEffect` keyed on `open` + `editingAccount` to reset all form fields |
| 2 | Critical | **MonthlyDashboard uses `useMemo` as side-effect** — `useMemo` is called with `setEditConfirmedExpenses` etc. inside it. This is a React anti-pattern (side effects in useMemo). | `MonthlyDashboard.tsx` L63-75 | Replace `useMemo` with `useEffect` |
| 3 | High | **Tab bar overflow on mobile** — 4 tabs + settings gear in a single row causes horizontal overflow on screens < 640px. Settings button positioned at `-right-12` clips off-screen. | `Finance.tsx` L104-127 | Make tabs scrollable on mobile OR stack 2x2. Move settings button inside tab bar or into a header action. |
| 4 | High | **AddItemForm not mobile-friendly** — the add form has 3 columns (category select + name input + amount input) in a single row. Unreadable on mobile. | `AddItemForm.tsx` L42-57 | Stack vertically on mobile with `flex-col sm:flex-row` |
| 5 | High | **CategoryGroup edit row overflows** — edit mode has select + 2 inputs + 2 buttons all in one row. Breaks on mobile. | `CategoryGroup.tsx` L99-143 | Wrap to multiple rows on mobile |
| 6 | Medium | **"Financed" calculation ignores orphan wishlist items** — the memo in Finance.tsx only counts completed goals + already_funded, not acquired wishlist items outside completed goals | `Finance.tsx` L40-58 | Query acquired wishlist items and add their cost to `financedTotal` |
| 7 | Medium | **TransferSimulator: no balance validation warning** — user can input amount exceeding source account balance. The RPC blocks it server-side but no client-side feedback before submit. | `TransferSimulator.tsx` L34 | Add visual warning + disable button when `parsedAmount > fromAccount.balance` |
| 8 | Medium | **AccountCard dropdown hidden on mobile** — uses `opacity-0 group-hover:opacity-100` which doesn't work on touch devices | `AccountCard.tsx` L50 | Always show on mobile, hover-reveal on desktop |
| 9 | Low | **Hardcoded "+X more" in CategoryDonut** — not translated | `CategoryDonut.tsx` L104 | Replace with `t('common.moreItems', { count: ... })` |
| 10 | Low | **BalanceTrendSparkline shows flat zero line** when no validations exist — misleading visual | `BalanceTrendSparkline.tsx` | Show empty state message instead of flat chart |

### Responsive / UX Fixes

| # | Area | Issue | Fix |
|---|------|-------|-----|
| R1 | Finance tabs | 4 tabs + gear overflow on mobile | Use horizontal scroll with `overflow-x-auto` and hide scrollbar, or use 2-row layout on mobile |
| R2 | KPI cards | `text-2xl sm:text-3xl` can overflow with large currency values | Add `break-all` or use responsive font sizing |
| R3 | Transfer Simulator | 3-column grid breaks on small screens | Already has `grid-cols-1 sm:grid-cols-[...]` — OK |
| R4 | MonthlyHistory detail grid | `grid-cols-2 sm:grid-cols-4` — 4 columns too cramped on some tablets | Change to `grid-cols-2 lg:grid-cols-4` |

### State Management Optimizations

| # | Issue | Fix |
|---|-------|-----|
| S1 | `MonthlyDashboard.tsx` — side effects inside `useMemo` | Change to `useEffect` |
| S2 | `SmartFinancingPanel.tsx` — 3 separate `useEffect` hooks for linked state that fight each other on mount | Consolidate into a single `useEffect` with clear priority: settings > slider > default |
| S3 | `AddAccountModal` — form state not synced with `editingAccount` prop changes | Add reset `useEffect` |

---

## MISSION 2: Feature Additions (step by step, with validation)

### Step A: Dashboard Analytics Enhancement
- Add a **month-over-month comparison** widget (current vs previous month net)
- Add a **top 3 spending categories** mini-bar chart
- Improve donut chart with hover highlight and animated segments
- Add Net Worth from accounts to KPI row

### Step B: Transaction History Table
- Create a unified transaction view combining validated months, transfers, and recurring items
- Filterable by date range, category, type (expense/income/transfer)
- Sortable columns (date, amount, category)
- Inline edit/delete for unplanned items in past validations

### Step C: Budgets & Savings Goals
- Per-category monthly budget limits with progress bars
- Alert when nearing/exceeding budget threshold
- Savings goal tracker (target amount + deadline + progress ring)
- Integration with accounts: link a savings goal to a specific account

### Step D: Advanced Features (proposals)
- **CSV/PDF Export** — export monthly reports or full history
- **Recurring item frequency** — support weekly/biweekly/quarterly, not just monthly
- **Calendar view** — visual timeline of when expenses/income hit during the month
- **Budget alerts** — push notification when spending crosses 80%/100% of category budget

---

## Implementation Order

Mission 1 first (all fixes), then Mission 2 step-by-step with validation between each.

Mission 1 changes span ~12 files. No database schema changes needed (except for Step B/C in Mission 2). All fixes are code-level.

