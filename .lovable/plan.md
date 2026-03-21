

# Finance Module — Fixes, Transactions, Image Upload, Reorganization & Settings

## Issues Identified

1. **Missing i18n keys**: `finance.tabs.goals` doesn't exist — shows raw key. `finance.export.title`, `finance.export.success`, `finance.export.fullReport` also missing from both `en.json` and `fr.json`.
2. **Validation editing limitation**: When editing a past validated month, the modal uses recurring item totals as the base — but the user wants to override the actual income/expense values to match reality (not just add unplanned extras).
3. **No image upload** on recurring expenses/income in the Budget tab.
4. **No bank transaction tracking** — only recurring items + monthly validation.
5. **Tab naming is inconsistent** — "goals" tab contains budgets/savings, not goals.
6. **Settings are minimal** — only salary day, funding target, allocation. Missing currency preference for finance, default account, CSV import settings.

---

## Plan

### 1. Fix i18n Keys & Tab Renaming

- **Rename** the `goals` tab value to `savings` (or keep `goals` value but add proper i18n key).
- Add missing keys to `en.json` and `fr.json`:
  - `finance.tabs.goals` → rename to `finance.tabs.savings` = "Savings & Budgets" / "Épargne & Budgets"
  - `finance.export.title` = "Export" / "Exporter"
  - `finance.export.success` = "Report exported" / "Rapport exporté"
  - `finance.export.fullReport` = "Full Report (CSV)" / "Rapport complet (CSV)"
- Fix the tab trigger in `Finance.tsx` to use the correct key.

### 2. Reorganize Finance Tabs (5 tabs → 4 tabs)

Current: Dashboard | Budget | Goals | Accounts | Planner

New structure:
- **Dashboard** — KPIs, charts, trends (unchanged)
- **Budget** — Recurring items + monthly validation + history (unchanged)
- **Transactions** — NEW: bank operations log (manual + CSV import), filterable table
- **Accounts** — Bank accounts + transfer simulator + savings goals + budgets per category (merge current "Goals" tab content here since it's account-related)
- **Planner** — Projections (unchanged)

This reduces cognitive load and groups savings/budgets with accounts where they belong.

### 3. Bank Transactions System (NEW)

**Database**: Create `bank_transactions` table:
```
id, user_id, account_id (nullable FK to user_accounts), 
date, description, amount, type (debit/credit), 
category, note, source (manual/csv_import), 
created_at
```
With RLS policy for user ownership.

**Hook**: `useTransactions.ts` — CRUD + filtering by date range, category, account, type. Pagination support.

**Components**:
- `TransactionsTab.tsx` — main view with filter bar + table
- `TransactionTable.tsx` — sortable columns (date, description, amount, category), inline edit/delete
- `AddTransactionModal.tsx` — manual entry form
- `CsvImportModal.tsx` — upload CSV, column mapping UI, preview before import, insert batch

**CSV Import flow**:
1. Upload CSV file
2. Auto-detect columns (date, description, amount, debit/credit)
3. Show preview table with mapped data
4. User confirms → bulk insert into `bank_transactions`

### 4. Image Upload on Recurring Items (Budget Tab)

- Integrate `FinanceImageUpload` into `AddItemForm.tsx` — add small image button next to emoji
- Pass `icon_url` through `onAdd` callback (update signature to include `iconUrl`)
- Integrate into `CategoryGroup.tsx` edit mode — show current image, allow change
- Display image thumbnail (16x16 rounded) in item rows alongside emoji
- Update `FinancialBlock` and `MonthlyDashboard` prop chains to pass `icon_url`

### 5. Enhanced Validation Editing (Past Months)

Current problem: When editing a past month, the user can only toggle confirmations and add unplanned extras. The `actual_total_income` and `actual_total_expenses` are computed from recurring items + unplanned, so they can't override the real totals.

**Fix**: Add two new editable fields in the `ValidationFlowModal` when editing (not creating):
- "Actual total income" — pre-filled with stored value, user can override
- "Actual total expenses" — pre-filled with stored value, user can override

Pass an `isEditing` flag to `ValidationFlowModal`. When editing, show direct amount inputs on the confirm step instead of computing from recurring items. The `handleEditValidate` in `MonthlyDashboard` will use these user-provided values directly.

### 6. Enhanced Finance Settings

Add new settings to `FinanceSettingsModal`:
- **Default account** — dropdown to select primary bank account for transactions
- **CSV date format** — select between DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD for import
- **CSV delimiter** — comma, semicolon, tab
- **Budget alert threshold** — percentage (e.g. 80%) to warn when nearing category budget limit
- **Auto-categorization** — toggle to auto-assign categories to imported transactions based on keywords

These will be stored as new columns on the `profiles` table (or a dedicated `finance_settings` JSON column).

**Database**: Add columns to profiles:
```sql
ALTER TABLE profiles ADD COLUMN finance_default_account_id uuid REFERENCES user_accounts(id);
ALTER TABLE profiles ADD COLUMN finance_csv_date_format text DEFAULT 'YYYY-MM-DD';
ALTER TABLE profiles ADD COLUMN finance_csv_delimiter text DEFAULT ',';
ALTER TABLE profiles ADD COLUMN finance_budget_alert_pct integer DEFAULT 80;
```

### 7. i18n — All New Keys

Add complete translation keys for:
- Transactions tab, table headers, filters, CSV import modal
- Settings new fields
- Validation editing overrides
- Image upload labels

---

## File Impact

| Area | Files |
|------|-------|
| **Database** | 1 migration: `bank_transactions` table + profiles columns |
| **New hooks** | `src/hooks/useTransactions.ts` |
| **New components** | `TransactionsTab.tsx`, `TransactionTable.tsx`, `AddTransactionModal.tsx`, `CsvImportModal.tsx` |
| **Modified** | `Finance.tsx` (tabs reorganization), `AddItemForm.tsx` (image upload), `CategoryGroup.tsx` (image display), `FinancialBlock.tsx` (prop chain), `MonthlyDashboard.tsx` (edit flow), `ValidationFlowModal.tsx` (actual amounts override), `FinanceSettingsModal.tsx` (new settings), `AccountsOverview.tsx` (absorb budgets/savings) |
| **i18n** | `en.json`, `fr.json` (new keys + fix missing) |
| **Types** | `src/types/finance.ts` (BankTransaction type) |

