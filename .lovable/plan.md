

# Finance: Transaction-Account Balance Link + CSV Account Selection + Improvements

## Feature 1: CSV Import — Account Selection Before Parsing

The CSV import modal already has an account selector, but it appears **after** the file is parsed (buried below the preview table). Users miss it.

**Fix**: Move the account selector to the **top** of the modal, alongside the delimiter/date format selectors, so the user picks the target account BEFORE or alongside file selection. Make it a 3-column grid (date format | delimiter | account).

**File**: `CsvImportModal.tsx`

---

## Feature 2: Live Balance Tracking (Transactions ↔ Account Balance)

This is the core new feature. Currently, account balances are static numbers edited manually. The user wants:
- Set an **initial balance** + **reference date** on an account
- All transactions linked to that account automatically adjust the computed balance

### Database Migration
Add two columns to `user_accounts`:
```sql
ALTER TABLE public.user_accounts ADD COLUMN initial_balance numeric DEFAULT 0;
ALTER TABLE public.user_accounts ADD COLUMN balance_date date DEFAULT CURRENT_DATE;
```

### Logic
- **Computed balance** = `initial_balance` + SUM(credits after balance_date) - SUM(debits after balance_date)
- The existing `balance` column becomes a **cache/display** value, updated whenever transactions change
- A new hook `useComputedAccountBalance(accountId)` queries `bank_transactions` filtered by account + date range and computes the running total
- On the Accounts tab, each card shows **computed balance** instead of static balance
- When a transaction is added/edited/deleted/imported, invalidate both `bank_transactions` and `user_accounts` query caches

### UI Changes
- **AddAccountModal**: Add "Initial balance" field (already exists as `balance`) + "Balance as of" date picker
- **AccountCard**: Show computed balance. Add a small "last synced" indicator showing the number of linked transactions
- **TransactionsTab**: After any mutation (add/edit/delete/import), also invalidate `user-accounts` queries so balances refresh

### Hook Changes (`useTransactions.ts`)
- All mutation `onSuccess` callbacks should also invalidate `['user-accounts']`

### New Hook: `useAccountBalances.ts`
```typescript
// Computes live balance for each account:
// initial_balance + SUM(credit txs after balance_date) - SUM(debit txs after balance_date)
```

---

## Feature 3: Transaction Impact Indicators

When viewing transactions for a specific account, show a **running balance** column:
- Starting from the account's initial balance at balance_date
- Each row shows the cumulative balance after that transaction
- Gives the user a true bank-statement-like experience

**File**: `TransactionsTab.tsx` — add a conditional "Balance" column when an account filter is active

---

## Improvement Proposals

| # | Proposal | Description |
|---|----------|-------------|
| A | **Recurring item → Transaction auto-generation** | Option to auto-create transactions from recurring items at month validation, linking them to default account |
| B | **Account reconciliation mode** | Compare computed balance vs. real bank balance, highlight discrepancies |
| C | **Multi-currency accounts** | Add `currency` field per account for international users (EUR, USD, GBP) |
| D | **Transaction search by date range** | Add date range picker to filter transactions (currently only text search + type + account) |
| E | **Batch delete/categorize** | Select multiple transactions for bulk operations (especially useful after CSV import) |
| F | **Auto-categorization rules** | User-defined keyword→category mappings for imported CSV transactions |

---

## File Impact Summary

| Area | Files |
|------|-------|
| **Database** | 1 migration: add `initial_balance` + `balance_date` to `user_accounts` |
| **Modified hooks** | `useTransactions.ts` (invalidate accounts on mutations), new `useAccountBalances.ts` |
| **Modified components** | `CsvImportModal.tsx` (move account selector up), `AddAccountModal.tsx` (balance_date picker), `AccountCard.tsx` (computed balance), `TransactionsTab.tsx` (running balance column), `AccountsOverview.tsx` (use computed balances) |
| **Types** | `finance.ts` — add `initial_balance`, `balance_date` to `UserAccount` |
| **i18n** | New keys for balance date, running balance, reconciliation |

