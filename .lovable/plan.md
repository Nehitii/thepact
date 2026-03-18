

# Finance Module — Accounts, Transfers Simulator, History Editing, Icons & Financed Fix

## Summary

Six major work streams:
1. **Bank Accounts system** — new table + full CRUD + balance tracking
2. **Inter-account transfer simulator** — fictive transfers between accounts
3. **Icons/images on accounts and recurring items** — custom visual identification
4. **Editable Monthly History** — re-open and correct past validated months
5. **"Financed" calculation fix** — verify discrepancy with wishlist acquired items
6. **Improvement proposals**

---

## 1. Bank Accounts System (new `user_accounts` table)

### Database Migration

```sql
CREATE TABLE public.user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  bank_name text,
  account_type text DEFAULT 'checking', -- checking, savings, investment, credit, cash
  balance numeric DEFAULT 0,
  icon_emoji text,            -- quick emoji identifier (e.g. 🏦)
  icon_url text,              -- uploaded image URL for bank logo
  color text DEFAULT '#60a5fa', -- accent color for card
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own accounts"
  ON public.user_accounts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Transfer log table
CREATE TABLE public.account_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_account_id uuid REFERENCES public.user_accounts(id) ON DELETE CASCADE NOT NULL,
  to_account_id uuid REFERENCES public.user_accounts(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  note text,
  transfer_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.account_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own transfers"
  ON public.account_transfers FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### New Hook: `useAccounts.ts`
- `useAccounts(userId)` — fetch all accounts ordered by sort_order
- `useAddAccount()` / `useUpdateAccount()` / `useDeleteAccount()`
- `useAccountTransfers(userId)` — fetch transfer history
- `useCreateTransfer()` — debit from_account, credit to_account, log transfer

### New Components
- **`AccountsOverview.tsx`** — card grid showing all accounts with balances, icons, total net worth
- **`AccountCard.tsx`** — single account card with icon/emoji, balance, bank name, color accent
- **`AddAccountModal.tsx`** — form with name, bank, type, initial balance, emoji picker, image upload
- **`TransferSimulator.tsx`** — select from/to accounts, amount, note; preview balance changes before confirming

### Integration
- New **"Accounts"** tab in Finance page (4th tab alongside Dashboard/Budget/Planner)
- Dashboard KPI row: add "Net Worth" card = sum of all account balances
- Projections: show projected account evolution based on recurring income/expenses

---

## 2. Inter-Account Transfer Simulator

- Full-screen modal or panel within Accounts tab
- Dropdown: source account → target account
- Amount input with validation (cannot exceed source balance)
- Live preview: shows "before" and "after" balances for both accounts
- On confirm: atomic update of both account balances + insert transfer log
- Transfer history timeline below the simulator

---

## 3. Icons/Images on Accounts & Recurring Items

### Database Changes
Add columns to recurring tables:

```sql
ALTER TABLE public.recurring_expenses ADD COLUMN icon_emoji text;
ALTER TABLE public.recurring_expenses ADD COLUMN icon_url text;

ALTER TABLE public.recurring_income ADD COLUMN icon_emoji text;
ALTER TABLE public.recurring_income ADD COLUMN icon_url text;
```

### UI Changes
- **CategoryGroup.tsx** & **AddItemForm.tsx**: add emoji picker button + optional image upload next to item name
- Display emoji/image as a small badge left of the item name
- **AccountCard.tsx**: show `icon_emoji` or `icon_url` as the main visual identifier
- For image uploads: use existing `goal-images` bucket or create `finance-icons` bucket

---

## 4. Editable Monthly History

### Current Problem
`MonthlyHistory.tsx` has an `onEditMonth` prop but `MonthlyDashboard.tsx` does not pass it, making the Edit button a no-op.

### Solution
- **MonthlyDashboard.tsx**: add state `editingMonth` + pass `onEditMonth` handler to `MonthlyHistory`
- When triggered: open `ValidationFlowModal` pre-populated with the selected month's existing data
- The modal's `onValidate` calls `useUpsertMonthlyValidation` with the edited values
- Allow editing ALL fields: confirmed expenses, income, unplanned amounts, actual totals
- Add a "Reset validation" option to un-validate a month (set `validated_at = null`)

---

## 5. "Financed" Calculation Verification & Fix

### Current Logic (Finance.tsx lines 44-50)
```
Financed = SUM(completed/validated goals × estimated_cost) + already_funded
```

### Potential Issue
The wishlist shows acquired items whose costs may not match goal `estimated_cost` fields. If a user marks wishlist items as acquired without completing the parent goal, those costs don't appear in "Financed."

### Fix
- Add acquired wishlist items' costs to the financed calculation:
```
Financed = completed_goals_cost + already_funded + acquired_orphan_wishlist_cost
```
- Where `acquired_orphan_wishlist_cost` = SUM of acquired wishlist items whose parent goal is NOT yet completed (to avoid double-counting)
- Apply the same logic in `Home.tsx` CostTrackingModule

---

## 6. Improvement Proposals

| # | Feature | Description |
|---|---------|-------------|
| A | **Budget Alerts** | Threshold notifications when spending exceeds X% of income |
| B | **CSV/PDF Export** | Export monthly reports or full financial data as downloadable files |
| C | **Month-over-Month Comparison** | Side-by-side view comparing two validated months |
| D | **Spending Category Trends** | Line chart showing how each category evolves over time |
| E | **Account Balance History** | Track balance snapshots over time for each account |
| F | **Recurring Item Frequency** | Support weekly/biweekly/quarterly frequencies, not just monthly |

---

## File Impact Summary

| Area | Files |
|------|-------|
| **Database** | 1 migration (2 new tables + 4 ALTER columns) |
| **New hooks** | `src/hooks/useAccounts.ts` |
| **New components** | `AccountsOverview`, `AccountCard`, `AddAccountModal`, `TransferSimulator` (~4 files) |
| **Modified components** | `Finance.tsx`, `FinanceDashboard.tsx`, `MonthlyDashboard.tsx`, `MonthlyHistory.tsx`, `CategoryGroup.tsx`, `AddItemForm.tsx`, `Home.tsx` |
| **Types** | `src/types/finance.ts` (new Account/Transfer types) |
| **i18n** | `en.json`, `fr.json` (new keys for accounts, transfers, tabs) |

