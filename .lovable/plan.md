

# Finance Module — Full Audit & Fixes

## Issues Found

### 1. CSV Import Only Detects 4 Rows
**Root cause**: The parser assumes a rigid format (date=col[0], desc=col[1], amount=col[2]) and skips rows where:
- Amount parses as `0` or `NaN` (French decimals use commas like `1 234,56` — the regex strips spaces but not thousands separators)
- Date parsing fails (returns `NaN-NaN-NaN`) for formats that don't match the selected `dateFormat`
- Lines with extra quoted fields or embedded delimiters get split incorrectly

**Fix**:
- Improve amount parsing: handle thousands separators (`1.234,56` or `1 234,56`), strip spaces before parsing
- Add smarter column auto-detection: scan header row for keywords (date, montant, débit, crédit, libellé, description, amount)
- Support separate debit/credit columns (common in French bank CSVs)
- Use the user's CSV settings from `FinanceSettingsModal` (date format + delimiter) as defaults instead of hardcoded values
- Remove the `amount === 0` skip — legitimate zero-amount rows are rare but rows with parsing failures shouldn't be silently dropped; show a warning count

### 2. Missing i18n Keys: `finance.budgets.*` and `finance.savings.*`
**Root cause**: `BudgetProgressPanel` uses `t('finance.budgets.title')`, `t('finance.budgets.subtitle')`, etc. and `SavingsGoalTracker` uses `t('finance.savings.title')`, `t('finance.savings.subtitle')`, etc. — none of these keys exist in `en.json` or `fr.json`.

**Fix**: Add complete `finance.budgets` and `finance.savings` key blocks to both locale files.

### 3. Account Types Too Limited
**Root cause**: `ACCOUNT_TYPES` in `AddAccountModal.tsx` only has `['checking', 'savings', 'investment', 'credit', 'cash']`. Missing French products like livrets (Livret A, LDDS, LEP), PEL, PEA, assurance-vie, etc.

**Fix**: Expand `ACCOUNT_TYPES` to include: `checking`, `savings`, `livret`, `investment`, `retirement`, `insurance`, `credit`, `cash`, `crypto`, `other`. Add i18n keys for each.

### 4. Not Enough Colors in Account Modal
**Root cause**: `ACCENT_COLORS` array in `AddAccountModal.tsx` only has 10 colors.

**Fix**: Expand to ~20 colors covering a wider spectrum including darker/warmer tones.

### 5. Clicking Account Card → Navigate to Filtered Transactions
**Current behavior**: Account cards only show edit/delete actions.

**Fix**: Make the account card body clickable. On click, navigate to the Transactions tab with a pre-set account filter. This requires:
- Adding an `onSelect` callback to `AccountCard`
- In `AccountsOverview`, when an account is clicked, call a callback that sets the active tab to "transactions" and passes the account ID as a filter
- Lift the tab state + account filter state up to `Finance.tsx` so it can be shared between tabs
- In `TransactionsTab`, accept an optional `defaultAccountFilter` prop and apply it

### 6. Finance Settings → CSV Settings Not Used by CsvImportModal
**Current behavior**: `CsvImportModal` has its own hardcoded defaults for delimiter and date format instead of reading from user settings.

**Fix**: Pass `financeSettings` (date format + delimiter) to `TransactionsTab` → `CsvImportModal` so they're pre-filled.

---

## Implementation Steps

### Step 1: Fix i18n — Add Missing Keys
Add `finance.budgets` and `finance.savings` sections to both `en.json` and `fr.json`:
- `budgets.title`, `budgets.subtitle`, `budgets.empty`, `budgets.emptyHint`, `budgets.limitPlaceholder`, `budgets.exceeded`, `budgets.used`
- `savings.title`, `savings.subtitle`, `savings.empty`, `savings.goalName`, `savings.targetAmount`, `savings.currentAmount`, `savings.deadline`, `savings.daysLeft`, `savings.updateAmount`
- New account types i18n: `finance.accounts.types.livret`, `.retirement`, `.insurance`, `.crypto`, `.other`

### Step 2: Expand Account Types & Colors
- `AddAccountModal.tsx`: expand `ACCOUNT_TYPES` and `ACCENT_COLORS` arrays
- Add corresponding i18n translations

### Step 3: Fix CSV Import Parser
- Rewrite `handleFile` in `CsvImportModal.tsx`:
  - Auto-detect header columns by matching keywords
  - Handle French number formats (thousands separator, comma decimal)
  - Use settings-provided delimiter and date format as defaults
  - Accept `defaultDateFormat` and `defaultDelimiter` props from parent

### Step 4: Account Click → Transaction Filter
- Add `accountFilter` state + `setAccountFilter` to `Finance.tsx`
- Pass `onSelectAccount` callback through `AccountsOverview` → `AccountCard`
- On click: set `activeTab = 'transactions'` + `accountFilter = account.id`
- `TransactionsTab`: accept `accountFilter` prop, add account filter dropdown, pre-select when provided
- Reset filter when user clears it

### Step 5: Pass Finance Settings to CSV Modal
- Thread `financeSettings` from `Finance.tsx` → `TransactionsTab` → `CsvImportModal`
- Use `finance_csv_date_format` and `finance_csv_delimiter` as initial state

---

## Files to Modify

| File | Change |
|------|--------|
| `src/i18n/locales/en.json` | Add `finance.budgets.*`, `finance.savings.*`, new account types |
| `src/i18n/locales/fr.json` | Same keys in French |
| `src/components/finance/accounts/AddAccountModal.tsx` | Expand types & colors |
| `src/components/finance/accounts/AccountCard.tsx` | Add onClick handler for navigation |
| `src/components/finance/accounts/AccountsOverview.tsx` | Add onSelectAccount prop |
| `src/components/finance/transactions/CsvImportModal.tsx` | Rewrite parser, accept settings props |
| `src/components/finance/transactions/TransactionsTab.tsx` | Accept accountFilter prop, add account dropdown filter |
| `src/pages/Finance.tsx` | Add accountFilter state, wire callbacks between tabs |

