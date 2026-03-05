

# /Finance Section -- Design Audit & Complete Overhaul Plan

---

## Current State Analysis

The Finance section has 3 tabs (Overview, Monthly, Projections) with a neumorphic dark design. After auditing all components, here are the key findings:

### Design Issues

1. **Overview tab is underpowered** -- Only 2 cards side-by-side (FinanceOverviewCard + SmartFinancingPanel). The overview doesn't feel like a dashboard; it's more like a settings page with a progress bar and a slider calculator. No at-a-glance summary of the user's financial health.

2. **Information architecture is fragmented** -- The "Smart Financing" calculator (how many months to pay off the project) is on the Overview tab, but the actual recurring expenses/income it depends on are hidden in the Monthly tab. The user has to mentally connect data across tabs.

3. **MonthlyBalanceHero is oversized** -- 520 lines for a single hero component containing animated numbers, savings ring, pie charts, sparkline, and tooltips. It dominates the Monthly tab and pushes the actual interactive content (expense/income lists) far below the fold.

4. **Redundant charts** -- The expense distribution pie chart appears in both `MonthlyBalanceHero` (Monthly tab) AND `ProjectionsPanel` (Projections tab). Same data, same visual.

5. **Tab structure doesn't match user mental model** -- Users think: "How much do I earn/spend?" then "Am I on track for my project?" then "What does the future look like?". The current tabs don't map to this flow cleanly.

6. **MonthlyValidationPanel has hardcoded English strings** -- "Expenses Paid", "Income Received", "Validate This Month", "Validated", "Edit", "No history yet", etc. are not using the i18n system.

7. **SmartFinancingPanel existingBalance is ephemeral** -- The "existing balance" input resets on every page load. The value is never persisted (the memory note says it should be stored in profile).

8. **FinancialBlock is 506 lines** -- The category group + add form + edit inline + delete dialog are all crammed into one file with no sub-component extraction.

---

## Proposed Restructuring

### New Tab Layout (3 tabs, restructured)

| Tab | Name | Content |
|-----|------|---------|
| 1 | **Dashboard** | Unified financial snapshot: KPI row (Net Balance, Savings Rate, Months to Goal, Yearly Projection) + Project Funding progress card + 6-month balance trend chart + expense/income donut (single, not duplicated) |
| 2 | **Budget** | Recurring Expenses & Income blocks (existing FinancialBlock) + Monthly Validation panel + Monthly History timeline |
| 3 | **Planner** | Smart Financing calculator (slider) + Balance Evolution line chart (projected vs actual) + Project deadline tracking |

### Phase-by-Phase Implementation

---

**Phase 1: Fix i18n and persistence bugs**
- Replace all hardcoded English strings in `MonthlyValidationPanel`, `MonthlyHistory`, `MonthlyBalanceHero`, and `FinancialBlock` with `t()` calls
- Persist `existingBalance` from SmartFinancingPanel to the profile table (add column via migration if needed, or reuse an existing field)

**Phase 2: Restructure tab layout**
- Rename tabs: Overview -> Dashboard, Monthly -> Budget, Projections -> Planner
- Move the KPI stat cards (savings rate, monthly net, yearly projection, months to goal) from Projections to the new Dashboard tab as the top hero row
- Move the Project Funding progress card (FinanceOverviewCard) into the Dashboard tab below the KPI row
- Move the expense/income donut chart into Dashboard (remove the duplicate from Projections)
- Move the 6-month sparkline trend from MonthlyBalanceHero into the Dashboard tab

**Phase 3: Slim down MonthlyBalanceHero**
- The hero is now only used in the Budget tab. Strip it down to just show: net balance (animated number) + savings rate ring. No more pie charts or sparkline (those moved to Dashboard).
- Extract `AnimatedNumber`, `SavingsRateRing`, and `BalanceTrendSparkline` into their own files under `src/components/finance/widgets/` for reuse.

**Phase 4: Build the new Dashboard tab**
- Create `src/components/finance/FinanceDashboard.tsx` composing:
  - KPI stat row (4 cards, taken from ProjectionsPanel logic)
  - FinanceOverviewCard (project funding progress)
  - Side-by-side: Expense donut + Income donut (extracted widget)
  - BalanceTrendSparkline (extracted widget)
- All in a responsive grid layout with staggered entry animations

**Phase 5: Rebuild the Planner tab**
- Keep SmartFinancingPanel as the primary content
- Keep the Balance Evolution area chart (from ProjectionsPanel)
- Add the positive/negative balance summary banner
- Remove the pie chart and KPI cards (now on Dashboard)

**Phase 6: Component extraction from FinancialBlock**
- Extract `CategoryGroup` into its own file `src/components/finance/monthly/CategoryGroup.tsx`
- Extract the "Add Item Form" into `src/components/finance/monthly/AddItemForm.tsx`
- Keep `FinancialBlock` as the orchestrator (~150 lines instead of 506)

---

### File Changes Summary

| Action | File |
|--------|------|
| Create | `src/components/finance/widgets/AnimatedNumber.tsx` |
| Create | `src/components/finance/widgets/SavingsRateRing.tsx` |
| Create | `src/components/finance/widgets/BalanceTrendSparkline.tsx` |
| Create | `src/components/finance/widgets/CategoryDonut.tsx` |
| Create | `src/components/finance/widgets/index.ts` |
| Create | `src/components/finance/FinanceDashboard.tsx` |
| Create | `src/components/finance/monthly/CategoryGroup.tsx` |
| Create | `src/components/finance/monthly/AddItemForm.tsx` |
| Rewrite | `src/pages/Finance.tsx` (new tab structure) |
| Rewrite | `src/components/finance/monthly/MonthlyBalanceHero.tsx` (slim version) |
| Edit | `src/components/finance/ProjectionsPanel.tsx` (remove KPIs + pie, keep charts) |
| Edit | `src/components/finance/monthly/FinancialBlock.tsx` (extract sub-components) |
| Edit | `src/components/finance/monthly/MonthlyValidationPanel.tsx` (i18n fix) |
| Edit | `src/components/finance/monthly/MonthlyHistory.tsx` (i18n fix) |
| Possible migration | Add `existing_balance` column to profiles if not reusing an existing field |

No database schema changes are required beyond the optional `existing_balance` persistence.

