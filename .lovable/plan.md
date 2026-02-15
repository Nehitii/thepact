
# Link Cost Items to Steps + Categories + Auto-Acquisition

## Overview

This feature connects cost items to specific steps within a goal. When a step is completed, its linked cost items are automatically marked as "acquired" in the wishlist. Additionally, cost items gain a **category** field (Furniture, Clothing, etc.) for better organization.

## What Changes

### 1. Database Schema Update

Add two new columns to `goal_cost_items`:
- **`step_id`** (UUID, nullable, FK to `steps.id` ON DELETE SET NULL) -- which step this cost item is linked to
- **`category`** (TEXT, nullable) -- item category (furniture, clothing, electronics, etc.)

No new RLS policies needed -- existing policies already cover CRUD via the goal/pact ownership chain.

### 2. Cost Item Categories

Define a reusable list of cost item categories in `src/lib/goalConstants.ts`:

| Value | Label |
|-------|-------|
| furniture | Furniture |
| clothing | Clothing |
| electronics | Electronics |
| tools | Tools & Equipment |
| materials | Materials |
| software | Software |
| services | Services |
| food | Food & Supplies |
| transport | Transport |
| education | Education |
| health | Health |
| decoration | Decoration |
| other | Other |

### 3. CostItemsEditor Enhancement

Update the editor UI to include:
- A **category selector** (compact Select dropdown) per cost item row
- A **step linker** (optional Select dropdown) to associate a cost item with a specific step
- The step dropdown only appears in GoalDetail edit mode (where steps are known), not in NewGoal (steps don't exist yet)

The `CostItemData` interface gains `category?: string` and `stepId?: string | null`.

### 4. Auto-Acquisition on Step Completion

In `GoalDetail.tsx` `handleToggleStep`:
- When a step is marked **completed**, find all cost items linked to that step (`step_id = stepId`)
- For each linked cost item, find the corresponding `wishlist_items` entry (matched via `source_goal_cost_id`)
- Mark those wishlist items as `acquired = true, acquired_at = now()`
- When a step is **uncompleted**, reverse the process (set `acquired = false, acquired_at = null`)
- Invalidate `pact-wishlist` query cache so the `/wishlist` page updates immediately

### 5. Cost Tracking in /Home

No changes needed to the cost tracking calculation itself. The existing logic already computes "Financed" from completed goals' `estimated_cost` + `already_funded`. Individual cost item acquisition doesn't change the macro-level tracking. The `/wishlist` page already shows acquired vs. active items.

### 6. Save Logic Update

Update `useSaveCostItems` to persist the new `category` and `step_id` fields when saving cost items. The delete-and-reinsert pattern already used will naturally handle this.

### 7. Display Updates

- **GoalDetail cost items list** (read-only view at lines 756-773): Show category badge and linked step name next to each cost item
- **Wishlist**: Already shows `source_goal_cost_id` items with goal links -- no changes needed, acquired state auto-updates

---

## Technical Details

**Migration SQL:**
```text
ALTER TABLE goal_cost_items
  ADD COLUMN step_id UUID REFERENCES steps(id) ON DELETE SET NULL,
  ADD COLUMN category TEXT;
```

**Updated CostItemData interface:**
```text
export interface CostItemData {
  id?: string;
  name: string;
  price: number;
  category?: string;
  stepId?: string | null;
}
```

**Auto-acquisition logic (in handleToggleStep):**
```text
// After step status update succeeds:
if (newStatus === "completed") {
  // Find cost items linked to this step
  const linkedCostItems = costItems.filter(ci => ci.step_id === stepId);
  // Mark corresponding wishlist items as acquired
  for (const ci of linkedCostItems) {
    await supabase.from("wishlist_items")
      .update({ acquired: true, acquired_at: new Date().toISOString() })
      .eq("source_goal_cost_id", ci.id);
  }
} else {
  // Reverse: un-acquire
  const linkedCostItems = costItems.filter(ci => ci.step_id === stepId);
  for (const ci of linkedCostItems) {
    await supabase.from("wishlist_items")
      .update({ acquired: false, acquired_at: null })
      .eq("source_goal_cost_id", ci.id);
  }
}
queryClient.invalidateQueries({ queryKey: ["pact-wishlist"] });
```

**Files to modify:**
- `supabase/migrations/` -- new migration for `step_id` + `category` columns
- `src/lib/goalConstants.ts` -- add `COST_ITEM_CATEGORIES` array
- `src/components/goals/CostItemsEditor.tsx` -- add category select + step linker
- `src/hooks/useCostItems.ts` -- update interface + save logic for new fields
- `src/pages/GoalDetail.tsx` -- auto-acquisition logic in `handleToggleStep`, pass steps to CostItemsEditor, display category/step in read-only view
- `src/i18n/locales/en.json` -- category labels
- `src/i18n/locales/fr.json` -- category labels (French)
